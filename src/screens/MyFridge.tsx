import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import { useFridgeStore, useRecipeStore, useAuthStore } from '@store/store';
import { RecipeResultsModal } from '@components/modals/RecipeResultsModal';
import { PreferenceSelectorModal } from '@components/modals';
import { SavingModal } from '@components/modals/SavingModal';
import { CTAButton } from '@components/CTAButton';
import {
  MAX_INGREDIENTS,
  DIETARY_OPTIONS,
  CUISINE_OPTIONS,
  COOKING_TIME_OPTIONS,
  CATEGORY_OPTIONS,
  MATCHING_STRICTNESS_OPTIONS,
} from '@constants/myFridgeConstants';
import {
  getStrictnessLabel,
  getStrictnessDescription,
  getIngredientImageUrl,
} from '@utils/myFridgeHelpers';
import { useIngredientSearch } from '@hooks/useIngredientSearch';
import { useRecipeGeneration } from '@hooks/useRecipeGeneration';
import { useAutoImageGeneration } from '@hooks/useAutoImageGeneration';
import { regenerateSingleCourse, analyzeCookingActionsWithGemini } from '@services/gemini.service';
import { createStyles } from './MyFridge.styles';
import { haptics } from '@utils/haptics';
import * as Crypto from 'expo-crypto';

export default function MyFridgeScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  const { allRecipes, userRecipes } = useRecipeStore();

  // Kitchen store
  const {
    ingredients,
    addIngredient,
    removeIngredient,
    clearIngredients,
    preferences,
    setDietaryPreference,
    setCuisinePreference,
    setCookingTimePreference,
    setCategoryPreference,
    setMatchingStrictness,
    generatedRecipeTitles,
    addGeneratedRecipeTitle,
    clearGeneratedRecipeTitles,
    pendingRecipeUpdate,
    setPendingRecipeUpdate,
  } = useFridgeStore();

  // Local state for modals
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStrictnessModal, setShowStrictnessModal] = useState(false);

  // Recipe generation mode
  const [recipeMode, setRecipeMode] = useState<'quick' | 'fullCourse'>('quick');

  // Local state for caching
  const [lastGeneratedIngredients, setLastGeneratedIngredients] = useState<string[]>([]);

  // Batch save loading state
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Custom hooks
  const {
    searchQuery,
    searchResults,
    isSearching,
    showSearchResults,
    showAddIngredient,
    setShowAddIngredient,
    handleSearch,
    handleSelectIngredient: onSelectIngredient,
    handleAddCustomIngredient,
    closeSearch,
  } = useIngredientSearch(addIngredient);

  const {
    isGenerating,
    generationError,
    currentRecipe,
    aiGeneratedRecipes,
    matchedExistingRecipes,
    showResultsModal,
    setShowResultsModal,
    generateRecipes,
    generateFullCourse,
    clearCurrentRecipe,
    updateSingleCourse,
  } = useRecipeGeneration(allRecipes, userRecipes, user?.uid);

  // Image generation hook for single course regeneration
  const { generateImageForRecipe } = useAutoImageGeneration();

  // Detect if current results are from full course menu
  const isFullCourseResults =
    aiGeneratedRecipes?.length === 3 && aiGeneratedRecipes?.every((r: any) => r.courseType);

  // Listen for updated recipes when returning from MyFridgeRecipeDetail
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (pendingRecipeUpdate) {
        const { recipe: updatedRecipe } = pendingRecipeUpdate;

        if (updatedRecipe.courseType) {
          updateSingleCourse(updatedRecipe.courseType, updatedRecipe);
        }

        setPendingRecipeUpdate(null);
      }
    });

    return unsubscribe;
  }, [navigation, pendingRecipeUpdate, updateSingleCourse, setPendingRecipeUpdate]);

  // Handlers
  const handleGenerateRecipe = async () => {
    // Check if ingredients have changed
    const currentIngredientIds = ingredients
      .map((ing) => ing.id)
      .sort()
      .join(',');
    const lastIngredientIds = [...lastGeneratedIngredients].sort().join(',');

    // If ingredients are the same and we have cached results, just show the modal
    if (
      currentIngredientIds === lastIngredientIds &&
      currentIngredientIds !== '' &&
      aiGeneratedRecipes &&
      aiGeneratedRecipes.length > 0
    ) {
      console.log('Ingredients unchanged - showing cached results');
      setShowResultsModal(true);
      return;
    }

    console.log('Ingredients changed or no cache - generating new recipes');

    // Clear previous recipe titles when starting fresh
    if (!currentRecipe) {
      clearGeneratedRecipeTitles();
    }

    await generateRecipes(ingredients, {
      dietary: preferences.dietary,
      cuisine: preferences.cuisine,
      cookingTime: preferences.cookingTime,
      category: preferences.category,
      matchingStrictness: preferences.matchingStrictness,
      excludeTitles: generatedRecipeTitles,
    });

    // Cache the ingredient IDs after successful generation
    setLastGeneratedIngredients(ingredients.map((ing) => ing.id));
  };

  // Handle refresh: generate a new recipe avoiding duplicates (force regeneration)
  const handleRefreshRecipe = async () => {
    console.log('Force regenerating new recipes');

    // Add all current AI recipe titles to exclusion list
    aiGeneratedRecipes.forEach((recipe) => {
      addGeneratedRecipeTitle(recipe.title);
    });

    // Force regeneration by clearing cache
    setLastGeneratedIngredients([]);

    await generateRecipes(ingredients, {
      dietary: preferences.dietary,
      cuisine: preferences.cuisine,
      cookingTime: preferences.cookingTime,
      category: preferences.category,
      matchingStrictness: preferences.matchingStrictness,
      excludeTitles: generatedRecipeTitles,
    });

    // Update cache after generation
    setLastGeneratedIngredients(ingredients.map((ing) => ing.id));
  };

  // Handle full course menu generation
  const handleGenerateFullCourse = async () => {
    if (ingredients.length < 5) {
      return; // Button should be disabled anyway
    }

    console.log('Generating full course menu');

    await generateFullCourse(ingredients, {
      dietary: preferences.dietary,
      cuisine: preferences.cuisine,
      cookingTime: preferences.cookingTime,
    });
  };

  const handleSelectRecipe = (recipe: any, source: 'ai' | 'existing') => {
    if (source === 'ai') {
      // Find the index of this recipe in aiGeneratedRecipes
      const recipeIndex = aiGeneratedRecipes?.findIndex((r: any) => r.title === recipe.title);

      // @ts-ignore - navigation types
      navigation.navigate('MyFridgeRecipeDetail', {
        recipe: recipe,
        source: 'my-fridge-ai',
        recipeIndex: recipeIndex !== -1 ? recipeIndex : undefined,
      });
    } else {
      // @ts-ignore - navigation types
      navigation.navigate('RecipeDetail', {
        recipe: recipe.recipe || recipe,
      });
    }
  };

  // Handle regenerating a specific course in the full course menu
  const handleRegenerateCourse = async (courseType: string) => {
    try {
      const ingredientNames = ingredients.map((ing) => ing.name);

      const result = await regenerateSingleCourse(
        ingredientNames,
        courseType as 'appetizer' | 'main' | 'dessert',
        preferences.dietary,
        preferences.cuisine
      );

      if (result.success && result.recipe && user?.uid) {

        // Generate cover image for the new recipe
        const tempRecipeId = Crypto.randomUUID();
        const imageResult = await generateImageForRecipe({
          userId: user.uid,
          recipeId: tempRecipeId,
          recipeData: {
            title: result.recipe.title,
            description: result.recipe.description,
            ingredients: result.recipe.ingredients,
            category: result.recipe.category,
            tags: result.recipe.tags,
          },
          silent: true,
        });

        // Add image URL if generated successfully
        if (imageResult.success && imageResult.imageUrl) {
          result.recipe.image = imageResult.imageUrl;
        }

        // Detect cooking appliances
        try {
          const applianceResult = await analyzeCookingActionsWithGemini(
            result.recipe.title,
            result.recipe.description,
            result.recipe.steps,
            result.recipe.cookTime
          );

          if (applianceResult && applianceResult.suggestedActions && applianceResult.suggestedActions.length > 0) {
            // Map cooking actions to their corresponding steps
            const stepsWithActions = result.recipe.steps.map((step, index) => {
              const actionForThisStep = applianceResult.suggestedActions.find(
                (action: any) => action.stepIndex === index
              );
              return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
            });

            result.recipe.steps = stepsWithActions;
            result.recipe.chefiqSuggestions = applianceResult;
          }
        } catch (error) {
          // Continue without appliances if detection fails
        }

        // Add courseType to the recipe
        const updatedRecipe = {
          ...result.recipe,
          courseType,
        };

        // Update only this course in the state
        updateSingleCourse(courseType, updatedRecipe);
      } else {
        console.error('Failed to regenerate course:', result.error);
        // Optionally show error to user
      }
    } catch (error) {
      console.error('Error regenerating course:', error);
    }
  };

  // Handle saving multiple recipes at once (batch save)
  const handleSaveMultipleRecipes = async (recipes: any[]) => {
    if (recipes.length === 0) {
      return;
    }

    if (!user?.uid) {
      haptics.error();
      alert('Please sign in to save recipes');
      return;
    }

    setIsBatchSaving(true);

    try {
      // Import convertScrapedToRecipe helper
      const { convertScrapedToRecipe } = await import('@utils/helpers/recipeConversion');

      // Convert all scraped recipes to Recipe format
      const convertedRecipes = recipes.map((scrapedRecipe) =>
        convertScrapedToRecipe(scrapedRecipe)
      );

      // Use batch save for better performance
      const { addRecipesBatch } = useRecipeStore.getState();
      await addRecipesBatch(convertedRecipes, user.uid);

      haptics.success();

      // Clear the generated recipes and modal state
      clearCurrentRecipe();
      setShowResultsModal(false);

      // Clear ingredients from My Kitchen
      clearIngredients();

      // Clear generated recipe titles cache
      clearGeneratedRecipeTitles();

      // Show success message
      alert(`${recipes.length} recipe${recipes.length > 1 ? 's' : ''} saved successfully!`);

      // Navigate to My Recipes tab
      // @ts-ignore
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'TabNavigator',
            state: {
              routes: [{ name: 'MyRecipes' }],
              index: 0,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error saving recipes:', error);
      haptics.error();
      alert('Failed to save recipes. Please try again.');
    } finally {
      setIsBatchSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <View style={{ flex: 1 }} pointerEvents={isGenerating ? 'none' : 'auto'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Preferences Section */}
          <View style={styles.preferencesContainer}>
            <TouchableOpacity
              onPress={() => setShowPreferences(!showPreferences)}
              style={styles.preferencesToggle}>
              <View style={styles.preferencesHeader}>
                <Ionicons name="options-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.preferencesTitle}>Preferences (Optional)</Text>
              </View>
              <Ionicons
                name={showPreferences ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>

            {showPreferences && (
              <View style={styles.preferencesContent}>
                {/* Dietary Preference */}
                <TouchableOpacity
                  onPress={() => setShowDietaryModal(true)}
                  style={styles.preferenceButton}>
                  <View>
                    <Text style={styles.preferenceLabel}>Dietary Restriction</Text>
                    <Text style={styles.preferenceValue}>{preferences.dietary}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>

                {/* Cuisine Preference */}
                <TouchableOpacity
                  onPress={() => setShowCuisineModal(true)}
                  style={styles.preferenceButton}>
                  <View>
                    <Text style={styles.preferenceLabel}>Cuisine</Text>
                    <Text style={styles.preferenceValue}>{preferences.cuisine}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>

                {/* Cooking Time */}
                <TouchableOpacity
                  onPress={() => setShowTimeModal(true)}
                  style={styles.preferenceButton}>
                  <View>
                    <Text style={styles.preferenceLabel}>Cooking Time</Text>
                    <Text style={styles.preferenceValue}>{preferences.cookingTime}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>

                {/* Category Preference */}
                <TouchableOpacity
                  onPress={() => setShowCategoryModal(true)}
                  style={styles.preferenceButton}>
                  <View>
                    <Text style={styles.preferenceLabel}>Recipe Category</Text>
                    <Text style={styles.preferenceValue}>{preferences.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>

                {/* Matching Strictness */}
                <TouchableOpacity
                  onPress={() => setShowStrictnessModal(true)}
                  style={[styles.preferenceButton, styles.preferenceButtonLast]}>
                  <View>
                    <Text style={styles.preferenceLabel}>Matching Mode</Text>
                    <Text style={styles.preferenceValue}>
                      {getStrictnessLabel(preferences.matchingStrictness)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Main Ingredient Section */}
          <View style={styles.mainContent}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>What's in Your Kitchen?</Text>
              <Text style={styles.headerSubtitle}>
                {ingredients.length === 0
                  ? `Add ingredients to get AI-powered recipe ideas`
                  : `${ingredients.length}/${MAX_INGREDIENTS} ingredients`}
              </Text>
              {ingredients.length > 0 && (
                <TouchableOpacity onPress={clearIngredients} style={styles.clearAllButton}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Recipe Mode Toggle */}
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                onPress={() => setRecipeMode('quick')}
                style={[
                  styles.modeToggleButton,
                  recipeMode === 'quick' && styles.modeToggleButtonActive,
                ]}>
                <Text
                  style={[
                    styles.modeToggleText,
                    recipeMode === 'quick' && styles.modeToggleTextActive,
                  ]}>
                  🔍 Quick Recipes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRecipeMode('fullCourse')}
                style={[
                  styles.modeToggleButton,
                  recipeMode === 'fullCourse' && styles.modeToggleButtonActive,
                ]}>
                <Text
                  style={[
                    styles.modeToggleText,
                    recipeMode === 'fullCourse' && styles.modeToggleTextActive,
                  ]}>
                  🍽️ Full Course
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ingredient Grid */}
            <View style={styles.ingredientGrid}>
              {/* Filled ingredient boxes */}
              {ingredients.map((ingredient) => (
                <TouchableOpacity
                  key={ingredient.id}
                  onPress={() => {
                    haptics.light();
                    removeIngredient(ingredient.id);
                  }}
                  style={styles.ingredientBox}>
                  {/* Remove button */}
                  <View style={styles.ingredientRemoveButton}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.error.main} />
                  </View>

                  {/* Ingredient icon */}
                  {ingredient.image && (
                    <Image
                      source={{ uri: getIngredientImageUrl(ingredient.image) }}
                      style={styles.ingredientImage}
                      resizeMode="contain"
                    />
                  )}

                  {/* Ingredient name */}
                  <Text style={styles.ingredientName} numberOfLines={2}>
                    {ingredient.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Add ingredient box */}
              {ingredients.length < MAX_INGREDIENTS && (
                <TouchableOpacity
                  onPress={() => setShowAddIngredient(true)}
                  style={styles.addIngredientBox}>
                  <View style={styles.addIconCircle}>
                    <Ionicons name="add" size={28} color={theme.colors.primary.main} />
                  </View>
                  <Text style={styles.addText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Ingredient Search Modal */}
            {showAddIngredient && (
              <View style={styles.searchModal}>
                {/* Search Header */}
                <View style={styles.searchHeader}>
                  <Text style={styles.searchTitle}>Add Ingredient</Text>
                  <TouchableOpacity onPress={closeSearch}>
                    <Ionicons name="close-circle" size={24} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                {/* Search Input */}
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={handleSearch}
                    onSubmitEditing={handleAddCustomIngredient}
                    placeholder="Type ingredient name (e.g., chicken, tomato)..."
                    placeholderTextColor={theme.colors.text.secondary}
                    style={styles.searchInput}
                    autoFocus
                    returnKeyType="done"
                  />
                  {isSearching && (
                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
                  )}
                </View>

                {/* Search Results */}
                {showSearchResults && searchResults && searchResults.length > 0 && (
                  <ScrollView
                    style={styles.searchResults}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled">
                    {searchResults.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => onSelectIngredient(item)}
                        style={styles.searchResultItem}>
                        {item.image && (
                          <Image
                            source={{ uri: getIngredientImageUrl(item.image) }}
                            style={styles.searchResultImage}
                          />
                        )}
                        <Text style={styles.searchResultText}>{item.name}</Text>
                        <Ionicons name="add-circle" size={24} color={theme.colors.primary.main} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Error Message */}
          {generationError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error.main} />
              <Text style={styles.errorText}>{generationError}</Text>
            </View>
          )}
        </ScrollView>

        {/* Fixed CTA Button at Bottom */}
        <View style={styles.ctaContainer}>
          <CTAButton
            onPress={() => {
              if (recipeMode === 'quick') {
                handleGenerateRecipe();
              } else {
                if (isFullCourseResults) {
                  setShowResultsModal(true);
                } else {
                  handleGenerateFullCourse();
                }
              }
            }}
            disabled={
              ingredients.length === 0 || (recipeMode === 'fullCourse' && ingredients.length < 5)
            }
            loading={isGenerating}
            icon={recipeMode === 'quick' ? 'restaurant' : 'nutrition'}
            text={
              ingredients.length === 0
                ? 'Add Ingredients to Start'
                : recipeMode === 'quick'
                  ? aiGeneratedRecipes && aiGeneratedRecipes.length > 0 && !isFullCourseResults
                    ? 'View Recipe Ideas'
                    : 'Find Recipes'
                  : ingredients.length < 5
                    ? `Add ${5 - ingredients.length} More for Full Course`
                    : isFullCourseResults
                      ? 'View Full Course Menu'
                      : 'Create Full Course Menu'
            }
            loadingText={
              recipeMode === 'quick' ? 'Generating Recipes...' : 'Generating Full Course...'
            }
          />
          {ingredients.length > 0 && !isGenerating && (
            <Text style={styles.ctaSubtext}>
              {recipeMode === 'quick'
                ? aiGeneratedRecipes && aiGeneratedRecipes.length > 0 && !isFullCourseResults
                  ? 'View 2 recipe ideas from your ingredients'
                  : 'Get 2 recipe ideas + similar recipes from your collection'
                : ingredients.length < 5
                  ? 'Full course menu requires at least 5 ingredients'
                  : isFullCourseResults
                    ? 'View your 3-course meal from ingredients'
                    : 'Get a complete 3-course meal: Appetizer, Main & Dessert'}
            </Text>
          )}
        </View>
      </View>

      {/* Preference Modals */}
      <PreferenceSelectorModal
        visible={showDietaryModal}
        onClose={() => setShowDietaryModal(false)}
        title="Select Dietary Restriction"
        options={DIETARY_OPTIONS}
        selectedValue={preferences.dietary}
        onSelect={setDietaryPreference}
      />

      <PreferenceSelectorModal
        visible={showCuisineModal}
        onClose={() => setShowCuisineModal(false)}
        title="Select Cuisine"
        options={CUISINE_OPTIONS}
        selectedValue={preferences.cuisine}
        onSelect={setCuisinePreference}
      />

      <PreferenceSelectorModal
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        title="Select Cooking Time"
        options={COOKING_TIME_OPTIONS}
        selectedValue={preferences.cookingTime}
        onSelect={setCookingTimePreference}
      />

      <PreferenceSelectorModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Select Recipe Category"
        options={CATEGORY_OPTIONS}
        selectedValue={preferences.category}
        onSelect={setCategoryPreference}
      />

      <PreferenceSelectorModal
        visible={showStrictnessModal}
        onClose={() => setShowStrictnessModal(false)}
        title="Select Matching Mode"
        options={MATCHING_STRICTNESS_OPTIONS}
        selectedValue={preferences.matchingStrictness}
        onSelect={setMatchingStrictness}
        getOptionLabel={getStrictnessLabel}
        getOptionDescription={getStrictnessDescription}
      />

      {/* Recipe Results Modal */}
      <RecipeResultsModal
        visible={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        aiRecipes={aiGeneratedRecipes}
        existingRecipes={matchedExistingRecipes}
        onSelectRecipe={handleSelectRecipe}
        onGenerateMore={handleRefreshRecipe}
        onRegenerateCourse={handleRegenerateCourse}
        onSaveMultipleRecipes={handleSaveMultipleRecipes}
        isBatchSaving={isBatchSaving}
      />

      {/* Saving Modal */}
      <SavingModal visible={isGenerating} message="Generating recipes..." />
    </SafeAreaView>
  );
}
