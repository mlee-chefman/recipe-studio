import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
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
import { createStyles } from './MyFridge.styles';
import { haptics } from '@utils/haptics';

export default function MyFridgeScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { allRecipes, userRecipes } = useRecipeStore();

  // Fridge store
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
  } = useFridgeStore();

  // Local state for modals
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStrictnessModal, setShowStrictnessModal] = useState(false);

  // Local state for caching
  const [lastGeneratedIngredients, setLastGeneratedIngredients] = useState<string[]>([]);

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
    clearCurrentRecipe,
  } = useRecipeGeneration(allRecipes, userRecipes, user?.uid);

  // Handlers
  const handleGenerateRecipe = async () => {
    // Check if ingredients have changed
    const currentIngredientIds = ingredients.map(ing => ing.id).sort().join(',');
    const lastIngredientIds = [...lastGeneratedIngredients].sort().join(',');

    // If ingredients are the same and we have cached results, just show the modal
    if (currentIngredientIds === lastIngredientIds &&
        currentIngredientIds !== '' &&
        aiGeneratedRecipes.length > 0) {
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
    setLastGeneratedIngredients(ingredients.map(ing => ing.id));
  };

  // Handle refresh: generate a new recipe avoiding duplicates (force regeneration)
  const handleRefreshRecipe = async () => {
    console.log('Force regenerating new recipes');

    // Add all current AI recipe titles to exclusion list
    aiGeneratedRecipes.forEach(recipe => {
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
    setLastGeneratedIngredients(ingredients.map(ing => ing.id));
  };

  const handleSelectRecipe = (recipe: any, source: 'ai' | 'existing') => {
    if (source === 'ai') {
      // @ts-ignore - navigation types
      navigation.navigate('MyFridgeRecipeDetail', {
        recipe: recipe,
        source: 'my-fridge-ai',
      });
    } else {
      // @ts-ignore - navigation types
      navigation.navigate('RecipeDetail', {
        recipe: recipe.recipe || recipe,
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <View style={{ flex: 1 }} pointerEvents={isGenerating ? 'none' : 'auto'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Preferences Section */}
        <View style={styles.preferencesContainer}>
          <TouchableOpacity
            onPress={() => setShowPreferences(!showPreferences)}
            style={styles.preferencesToggle}
          >
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
                style={styles.preferenceButton}
              >
                <View>
                  <Text style={styles.preferenceLabel}>Dietary Restriction</Text>
                  <Text style={styles.preferenceValue}>{preferences.dietary}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              {/* Cuisine Preference */}
              <TouchableOpacity
                onPress={() => setShowCuisineModal(true)}
                style={styles.preferenceButton}
              >
                <View>
                  <Text style={styles.preferenceLabel}>Cuisine</Text>
                  <Text style={styles.preferenceValue}>{preferences.cuisine}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              {/* Cooking Time */}
              <TouchableOpacity
                onPress={() => setShowTimeModal(true)}
                style={styles.preferenceButton}
              >
                <View>
                  <Text style={styles.preferenceLabel}>Cooking Time</Text>
                  <Text style={styles.preferenceValue}>{preferences.cookingTime}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              {/* Category Preference */}
              <TouchableOpacity
                onPress={() => setShowCategoryModal(true)}
                style={styles.preferenceButton}
              >
                <View>
                  <Text style={styles.preferenceLabel}>Recipe Category</Text>
                  <Text style={styles.preferenceValue}>{preferences.category}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              {/* Matching Strictness */}
              <TouchableOpacity
                onPress={() => setShowStrictnessModal(true)}
                style={[styles.preferenceButton, styles.preferenceButtonLast]}
              >
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
            <Text style={styles.headerTitle}>What's in Your Fridge?</Text>
            <Text style={styles.headerSubtitle}>
              {ingredients.length === 0
                ? `Add ingredients to get AI-powered recipe ideas`
                : `${ingredients.length}/${MAX_INGREDIENTS} ingredients • Generate 2 recipes at a time`}
            </Text>
            {ingredients.length > 0 && (
              <TouchableOpacity onPress={clearIngredients} style={styles.clearAllButton}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
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
                style={styles.ingredientBox}
              >
                {/* Remove button */}
                <View style={styles.ingredientRemoveButton}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.error.main} />
                </View>

                {/* Ingredient icon */}
                {ingredient.image && (
                  <Image
                    source={{ uri: getIngredientImageUrl(ingredient.image) }}
                    style={styles.ingredientImage}
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
                style={styles.addIngredientBox}
              >
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
                {isSearching && <ActivityIndicator size="small" color={theme.colors.primary.main} />}
              </View>

              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <ScrollView style={styles.searchResults} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => onSelectIngredient(item)}
                      style={styles.searchResultItem}
                    >
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
            onPress={handleGenerateRecipe}
            disabled={ingredients.length === 0}
            loading={isGenerating}
            icon="restaurant"
            text={
              ingredients.length === 0
                ? 'Add Ingredients to Start'
                : aiGeneratedRecipes.length > 0
                  ? 'View Recipe Ideas'
                  : 'Generate Recipe Ideas'
            }
            loadingText="Generating Recipes..."
          />
          {ingredients.length > 0 && !isGenerating && (
            <Text style={styles.ctaSubtext}>
              {aiGeneratedRecipes.length > 0
                ? 'Tap to see your saved results or generate new ideas'
                : 'Get 2 AI-powered recipe ideas + similar recipes from your collection'}
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
      />

      {/* Saving Modal */}
      <SavingModal visible={isGenerating} message="Generating recipes..." />
    </SafeAreaView>
  );
}
