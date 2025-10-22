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
import { PreferenceSelectorModal } from '@components/PreferenceSelectorModal';
import {
  MAX_INGREDIENTS,
  DIETARY_OPTIONS,
  CUISINE_OPTIONS,
  COOKING_TIME_OPTIONS,
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
    setMatchingStrictness,
  } = useFridgeStore();

  // Local state for modals
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showStrictnessModal, setShowStrictnessModal] = useState(false);

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
    closeSearch,
  } = useIngredientSearch(addIngredient);

  const {
    isGenerating,
    generationError,
    aiGeneratedRecipes,
    matchedExistingRecipes,
    showResultsModal,
    setShowResultsModal,
    generateRecipes,
  } = useRecipeGeneration(allRecipes, userRecipes);

  // Handlers
  const handleGenerateRecipes = async () => {
    await generateRecipes(ingredients, {
      dietary: preferences.dietary,
      cuisine: preferences.cuisine,
      cookingTime: preferences.cookingTime,
      matchingStrictness: preferences.matchingStrictness,
    });
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
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
                ? `Add ingredients to discover recipe ideas you can make`
                : `${ingredients.length}/${MAX_INGREDIENTS} ingredients • Choose 1 recipe to create`}
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
                onPress={() => removeIngredient(ingredient.id)}
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
                  placeholder="Type ingredient name (e.g., chicken, tomato)..."
                  placeholderTextColor={theme.colors.text.secondary}
                  style={styles.searchInput}
                  autoFocus
                />
                {isSearching && <ActivityIndicator size="small" color={theme.colors.primary.main} />}
              </View>

              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <ScrollView style={styles.searchResults} nestedScrollEnabled>
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
        <TouchableOpacity
          onPress={handleGenerateRecipes}
          disabled={isGenerating || ingredients.length === 0}
          style={[
            styles.ctaButton,
            isGenerating || ingredients.length === 0
              ? styles.ctaButtonDisabled
              : styles.ctaButtonEnabled,
          ]}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color={theme.colors.text.inverse} />
              <Text style={styles.ctaButtonText}>Generating Ideas...</Text>
            </>
          ) : (
            <>
              <Ionicons name="restaurant" size={20} color={theme.colors.text.inverse} />
              <Text style={styles.ctaButtonText}>
                {ingredients.length === 0 ? 'Add Ingredients to Start' : 'Find Recipe Ideas'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        {ingredients.length > 0 && !isGenerating && (
          <Text style={styles.ctaSubtext}>
            Get 3 recipe options to choose from (AI + your collection matches)
          </Text>
        )}
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
        onGenerateMore={handleGenerateRecipes}
      />
    </SafeAreaView>
  );
}
