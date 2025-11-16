import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
 Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import { createStyles } from './MyFridgeRecipeDetail.styles';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { convertScrapedToRecipe, convertRecipeToScraped } from '~/utils/helpers/recipeConversion';
import { useRecipeStore, useAuthStore, useCartStore, useFridgeStore } from '@store/store';
import { instacartService } from '@services/instacart.service';
import { getApplianceById, getApplianceProductUrl } from '~/types/chefiq';
import { getCookingMethodIcon, formatKeyParameters } from '@utils/cookingActionHelpers';
import StepImage from '@components/StepImage';
import { haptics } from '@utils/haptics';
import { useIngredientImages } from '@hooks/useIngredientImages';
import { Toast } from '@components/Toast';

interface RouteParams {
  recipe: ScrapedRecipe & {
    missingIngredients?: string[];
    substitutions?: { missing: string; substitutes: string[] }[];
    matchPercentage?: number;
  };
  source: 'my-fridge-ai';
  recipeIndex?: number;
}

export default function MyFridgeRecipeDetailScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const { user } = useAuthStore();
  const { addRecipe } = useRecipeStore();
  const { addItems: addItemsToCart } = useCartStore();
  const { setPendingRecipeUpdate } = useFridgeStore();

  // Initialize recipe state, handling potential undefined
  const [recipe, setRecipe] = useState(params?.recipe || {} as any);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubstitutions, setActiveSubstitutions] = useState<Record<string, string>>({});

  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Ingredient selection state for shopping cart
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(
    new Set(recipe?.ingredients?.map((_, index) => index) || []) // All selected by default
  );

  // Apply active substitutions to ingredients list for display (memoized to prevent infinite loops)
  const displayIngredients = useMemo(() => {
    return recipe?.ingredients?.map((ingredient) => {
      // Check if this ingredient has an active substitution
      const substitutionEntry = Object.entries(activeSubstitutions).find(([missing]) =>
        ingredient.toLowerCase().includes(missing.toLowerCase())
      );

      if (substitutionEntry) {
        const [missing, substitute] = substitutionEntry;
        // Replace the missing ingredient with the substitute in the ingredient string
        return ingredient.replace(new RegExp(missing, 'gi'), substitute);
      }

      return ingredient;
    }) || [];
  }, [recipe?.ingredients, activeSubstitutions]);

  // Load ingredient images (using display ingredients with substitutions applied)
  const { images: ingredientImages, loading: imagesLoading } = useIngredientImages(
    displayIngredients,
    true // enabled
  );

  // Safely access properties with optional chaining
  const hasSubstitutions = recipe?.substitutions && recipe.substitutions.length > 0;

  // Filter missing ingredients based on active substitutions
  const filteredMissingIngredients = recipe?.missingIngredients?.filter(
    (ingredient) => !Object.keys(activeSubstitutions).some((missing) =>
      ingredient.toLowerCase().includes(missing.toLowerCase())
    )
  ) || [];
  const hasMissingIngredients = filteredMissingIngredients.length > 0;

  // Get ChefIQ appliance info from recipe suggestions
  const chefiqAppliance = recipe?.chefiqSuggestions?.suggestedAppliance;
  const hasChefIQActions = recipe?.steps?.some(step => step.cookingAction) || false;

  // Store reference to track if recipe was edited
  const [wasEdited, setWasEdited] = useState(false);

  // Listen for edited recipe returning from RecipeEdit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // @ts-ignore - navigation params
      const editedRecipe = route.params?.editedRecipe;
      if (editedRecipe) {
        // Convert the edited Recipe back to ScrapedRecipe format
        const updatedScrapedRecipe = convertRecipeToScraped(editedRecipe);

        // Preserve original fields that aren't in Recipe format
        const updatedRecipe = {
          ...updatedScrapedRecipe,
          missingIngredients: recipe?.missingIngredients,
          substitutions: recipe?.substitutions,
          matchPercentage: recipe?.matchPercentage,
          courseType: recipe?.courseType, // Preserve courseType if this is a full course recipe
        };

        setRecipe(updatedRecipe);
        setWasEdited(true); // Mark as edited

        // Clear the param to avoid re-applying on future focuses
        // @ts-ignore
        navigation.setParams({ editedRecipe: undefined });
      }
    });

    return unsubscribe;
  }, [navigation, route.params, recipe, params?.recipeIndex]);

  // Handle applying a substitution (allows toggling on/off)
  const handleApplySubstitution = (missing: string, substitute: string) => {
    setActiveSubstitutions((prev) => {
      // If already selected, deselect it
      if (prev[missing] === substitute) {
        const newSubstitutions = { ...prev };
        delete newSubstitutions[missing];
        return newSubstitutions;
      }

      // Otherwise, select it
      return {
        ...prev,
        [missing]: substitute,
      };
    });
  };

  // Handle editing the recipe
  const handleEdit = () => {
    if (!recipe) return;

    // Use display ingredients (which already have substitutions applied)
    const convertedRecipe = convertScrapedToRecipe({
      ...recipe,
      ingredients: displayIngredients,
    });

    const recipeToEdit = {
      ...convertedRecipe,
      id: 'temp-preview-recipe', // Temporary ID for preview mode
      source: 'my-fridge-ai',
    };

    // @ts-ignore - navigation types
    navigation.navigate('RecipeEdit', {
      recipe: recipeToEdit,
      previewMode: true, // Flag to indicate this is a preview edit, not a save
    });
  };

  // Handle saving recipe to collection
  const handleSaveRecipe = async () => {
    if (!user?.uid) {
      haptics.error();
      alert('Please sign in to save recipes');
      return;
    }

    if (!recipe) {
      haptics.error();
      alert('No recipe to save');
      return;
    }

    setIsSaving(true);

    try {
      // Convert to Recipe format (using display ingredients with substitutions applied)
      const convertedRecipe = convertScrapedToRecipe({
        ...recipe,
        ingredients: displayIngredients,
      });

      // addRecipe handles createdAt, updatedAt, and userId automatically
      await addRecipe(convertedRecipe, user.uid);

      haptics.success();

      // Reset navigation stack to prevent going back and creating duplicates
      // Navigate to MyRecipes tab to show the saved recipe
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
      console.error('Error saving recipe:', error);
      haptics.error();
      alert('Failed to save recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding missing ingredients to cart (excludes ingredients with active substitutions)
  const handleAddMissingToCart = async () => {
    if (!user?.uid) {
      haptics.error();
      Alert.alert('Sign In Required', 'Please sign in to add items to your cart.');
      return;
    }

    if (!hasMissingIngredients) {
      return;
    }

    try {
      // Convert filtered missing ingredient strings to CartItems
      const cartItems = filteredMissingIngredients.map((ingredient, index) => {
        const parsed = instacartService.parseIngredient(ingredient);

        return {
          id: `${recipe.title}-missing-${index}`,
          recipeId: 'my-fridge-ai-recipe', // Temporary ID for AI recipes
          recipeName: recipe.title || 'My Kitchen Recipe',
          recipeImage: recipe.image,
          recipeServings: recipe.servings || 1,
          recipeOriginalServings: recipe.servings || 1,
          ingredient: ingredient,
          quantity: parsed.quantity,
          unit: parsed.unit,
          name: parsed.name,
          selected: true,
          addedAt: Date.now(),
        };
      });

      // Save to Firebase cart
      await addItemsToCart(cartItems, user.uid);

      haptics.success();

      // Show toast notification
      setToastMessage(`${filteredMissingIngredients.length} missing ${filteredMissingIngredients.length === 1 ? 'ingredient' : 'ingredients'} added to cart`);
      setToastVisible(true);
    } catch (error) {
      console.error('Error adding missing ingredients to cart:', error);
      haptics.error();
      Alert.alert(
        'Error',
        'Failed to add items to cart. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Ingredient selection handlers
  const toggleIngredient = (index: number) => {
    // Haptic feedback for selection toggle
    haptics.selection();

    setSelectedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectAllIngredients = () => {
    setSelectedIngredients(new Set(recipe?.ingredients?.map((_, index) => index) || []));
  };

  const deselectAllIngredients = () => {
    setSelectedIngredients(new Set());
  };

  const allSelected = selectedIngredients.size === (recipe?.ingredients?.length || 0);
  const noneSelected = selectedIngredients.size === 0;

  // Handle adding regular (non-missing) ingredients to cart
  const handleAddIngredientsToCart = async () => {
    if (noneSelected) {
      haptics.error();
      Alert.alert('No Ingredients Selected', 'Please select at least one ingredient to add to cart.');
      return;
    }

    if (!user?.uid) {
      haptics.error();
      Alert.alert('Sign In Required', 'Please sign in to add items to your cart.');
      return;
    }

    try {
      // Build cart items from selected ingredients (using display ingredients with substitutions)
      const cartItems = Array.from(selectedIngredients).map(index => {
        const ingredient = displayIngredients[index];
        const parsed = instacartService.parseIngredient(ingredient);

        return {
          id: `${recipe.title}-ingredient-${index}`,
          recipeId: 'my-fridge-ai-recipe', // Temporary ID for AI recipes
          recipeName: recipe.title || 'My Kitchen Recipe',
          recipeImage: recipe.image,
          recipeServings: recipe.servings || 1,
          recipeOriginalServings: recipe.servings || 1,
          ingredient: ingredient,
          quantity: parsed.quantity,
          unit: parsed.unit,
          name: parsed.name,
          selected: true,
          addedAt: Date.now(),
        };
      });

      // Save to Firebase cart
      await addItemsToCart(cartItems, user.uid);

      haptics.success();

      // Show toast notification
      setToastMessage(`${selectedIngredients.size} ${selectedIngredients.size === 1 ? 'ingredient' : 'ingredients'} added to cart`);
      setToastVisible(true);
    } catch (error) {
      console.error('Error adding ingredients to cart:', error);
      haptics.error();
      Alert.alert(
        'Error',
        'Failed to add items to cart. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Toast navigation handler
  const handleToastPress = () => {
    setToastVisible(false);
    // @ts-ignore - Navigation typing issue
    navigation.navigate('GroceryCart');
  };

  // Handle going back to MyFridge with updated recipe
  const handleGoBack = () => {
    // If recipe was edited and we have a recipeIndex, store it for MyFridge to pick up
    if (wasEdited && params?.recipeIndex !== undefined && recipe) {
      setPendingRecipeUpdate({
        recipe: recipe,
        index: params.recipeIndex,
      });
    }
    navigation.goBack();
  };

  const totalTime = (recipe?.prepTime || 0) + (recipe?.cookTime || 0);

  // Return early if recipe is not loaded
  if (!recipe || !recipe.title) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.text.secondary }}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color={theme.colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Recipe Image */}
        {recipe.image && (
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        )}

        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
            {recipe.matchPercentage && (
              <View
                style={[
                  styles.matchBadge,
                  { backgroundColor: getMatchColor(recipe.matchPercentage, theme) },
                ]}
              >
                <Text style={styles.matchText}>{recipe.matchPercentage}%</Text>
              </View>
            )}
          </View>

          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color={theme.colors.primary.main} />
            <Text style={styles.aiBadgeText}>AI Generated Recipe</Text>
          </View>

          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}
        </View>

        {/* Recipe Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>{totalTime} min</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="restaurant-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>{recipe.servings} servings</Text>
          </View>
          {recipe.category && (
            <View style={styles.infoItem}>
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.infoText}>{recipe.category}</Text>
            </View>
          )}
        </View>

        {/* ChefIQ Appliance Info */}
        {chefiqAppliance && (
          <View style={styles.chefiqSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="hardware-chip" size={20} color={theme.colors.primary.main} />
              <Text style={styles.chefiqSectionTitle}>ChefIQ Appliance</Text>
            </View>
            <View style={styles.applianceCard}>
              {getApplianceById(chefiqAppliance)?.picture && (
                <Image
                  source={{ uri: getApplianceById(chefiqAppliance)?.picture }}
                  style={styles.applianceImage}
                />
              )}
              <View style={styles.applianceInfo}>
                <Text style={styles.applianceName}>
                  {getApplianceById(chefiqAppliance)?.name}
                </Text>
                {hasChefIQActions && (
                  <Text style={styles.applianceHint}>
                    Cooking actions assigned to steps
                  </Text>
                )}
              </View>
              {recipe.chefiqSuggestions?.useProbe && (
                <View style={styles.probeBadge}>
                  <Ionicons name="thermometer" size={14} color={theme.colors.warning.dark} />
                  <Text style={styles.probeText}>Probe</Text>
                </View>
              )}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              onPress={() => {
                const productUrl = getApplianceProductUrl(chefiqAppliance);
                Linking.openURL(productUrl);
              }}
              activeOpacity={0.7}
              style={styles.shopButton}
            >
              <Ionicons name="bag-handle-outline" size={16} color="white" />
              <Text style={styles.shopButtonText}>Shop this Appliance</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Missing Ingredients Section */}
        {hasMissingIngredients && (
          <View style={styles.missingSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error.main} />
              <Text style={styles.missingSectionTitle}>
                Missing Ingredients ({filteredMissingIngredients.length})
              </Text>
            </View>
            {filteredMissingIngredients.map((ingredient, index) => (
              <View key={index} style={styles.missingItem}>
                <Ionicons name="close-circle" size={16} color={theme.colors.error.main} />
                <Text style={styles.missingText}>{ingredient}</Text>
              </View>
            ))}
            {/* Add Missing to Cart Button */}
            <TouchableOpacity
              onPress={handleAddMissingToCart}
              style={styles.addMissingToCartButton}
            >
              <Ionicons name="cart" size={18} color="#fff" />
              <Text style={styles.addMissingToCartText}>
                Add Missing to Cart
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Substitutions Section */}
        {hasSubstitutions && (
          <View style={styles.substitutionsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="swap-horizontal" size={20} color={theme.colors.primary.main} />
              <Text style={styles.substitutionsSectionTitle}>
                Recommended Substitutions ({recipe.substitutions!.length})
              </Text>
            </View>
            <Text style={styles.substitutionsHint}>
              Tap a substitution to use it in the recipe
            </Text>
            {recipe.substitutions!.map((sub, index) => (
              <View key={index} style={styles.substitutionCard}>
                <View style={styles.substitutionHeader}>
                  <Text style={styles.substitutionMissing}>Missing: {sub.missing}</Text>
                  {activeSubstitutions[sub.missing] && (
                    <View style={styles.appliedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.colors.success.main} />
                      <Text style={styles.appliedText}>Applied</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.substitutionLabel}>Use instead:</Text>
                <View style={styles.substitutesContainer}>
                  {sub.substitutes.map((substitute, subIndex) => (
                    <TouchableOpacity
                      key={subIndex}
                      onPress={() => handleApplySubstitution(sub.missing, substitute)}
                      style={[
                        styles.substituteChip,
                        activeSubstitutions[sub.missing] === substitute && styles.substituteChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.substituteText,
                          activeSubstitutions[sub.missing] === substitute &&
                            styles.substituteTextActive,
                        ]}
                      >
                        {substitute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Ingredients Section */}
        <View style={styles.section}>
          <View style={styles.ingredientsHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>

            {/* Select All / None Controls */}
            <View style={styles.selectionControls}>
              <Text style={styles.selectionCount}>
                {selectedIngredients.size} of {displayIngredients.length} selected
              </Text>
              <View style={styles.selectionButtons}>
                <TouchableOpacity
                  onPress={selectAllIngredients}
                  disabled={allSelected}
                  style={[
                    styles.selectionButton,
                    allSelected && styles.selectionButtonDisabled
                  ]}
                >
                  <Text style={[
                    styles.selectionButtonText,
                    allSelected && styles.selectionButtonTextDisabled
                  ]}>
                    Select All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={deselectAllIngredients}
                  disabled={noneSelected}
                  style={[
                    styles.selectionButton,
                    noneSelected && styles.selectionButtonDisabled
                  ]}
                >
                  <Text style={[
                    styles.selectionButtonText,
                    noneSelected && styles.selectionButtonTextDisabled
                  ]}>
                    Clear All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Ingredients List with Images and Checkboxes */}
          <View style={styles.ingredientsListContainer}>
            {displayIngredients.map((ingredient, index) => {
              const originalIngredient = recipe.ingredients[index];
              const isModified = Object.keys(activeSubstitutions).some((missing) =>
                originalIngredient.toLowerCase().includes(missing.toLowerCase())
              );
              const imageUrl = ingredientImages.get(ingredient);
              const isLoading = imagesLoading && !imageUrl;
              const isSelected = selectedIngredients.has(index);

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleIngredient(index)}
                  activeOpacity={0.7}
                  style={styles.ingredientItem}
                >
                  {/* Checkbox */}
                  <TouchableOpacity
                    onPress={() => toggleIngredient(index)}
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </TouchableOpacity>

                  {/* Ingredient Image Container */}
                  <View style={styles.ingredientImageContainer}>
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.ingredientImage}
                      />
                    ) : isLoading ? (
                      <View style={styles.ingredientImagePlaceholder}>
                        <ActivityIndicator size="small" color={theme.colors.primary.main} />
                      </View>
                    ) : (
                      <View style={styles.ingredientBulletContainer}>
                        <Ionicons
                          name={isModified ? 'swap-horizontal' : 'ellipse'}
                          size={8}
                          color={isModified ? theme.colors.primary.main : theme.colors.text.secondary}
                        />
                      </View>
                    )}
                  </View>

                  {/* Ingredient Text - shows substituted ingredient if active */}
                  <Text
                    style={[
                      styles.ingredientText,
                      isModified && styles.ingredientTextModified
                    ]}
                  >
                    {ingredient}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={handleAddIngredientsToCart}
            disabled={noneSelected}
            style={[
              styles.addIngredientsToCartButton,
              noneSelected && styles.addIngredientsToCartButtonDisabled
            ]}
          >
            <Ionicons name="cart" size={18} color="#fff" />
            <Text style={styles.addIngredientsToCartText}>
              Add to Cart ({selectedIngredients.size} {selectedIngredients.size === 1 ? 'item' : 'items'})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.steps.map((step, index) => {
            const cookingAction = typeof step === 'object' ? step.cookingAction : undefined;
            const stepText = typeof step === 'string' ? step : step.text;
            const stepImage = typeof step === 'object' ? step.image : undefined;

            return (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepText}>{stepText}</Text>

                    {/* Step Image */}
                    {stepImage && (
                      <View style={styles.stepImageContainer}>
                        <StepImage imageUri={stepImage} editable={false} compact={true} />
                      </View>
                    )}
                  </View>
                </View>

                {/* Cooking Action for this step */}
                {cookingAction && (
                  <View style={styles.cookingActionCard}>
                    <View style={styles.cookingActionHeader}>
                      <Text style={styles.cookingActionIcon}>
                        {getCookingMethodIcon(
                          cookingAction.methodId,
                          getApplianceById(cookingAction.applianceId)?.thing_category_name
                        )}
                      </Text>
                      <View style={styles.cookingActionInfo}>
                        <Text style={styles.cookingActionMethod}>
                          {cookingAction.methodName}
                        </Text>
                        <Text style={styles.cookingActionParams}>
                          {formatKeyParameters(cookingAction)}
                        </Text>
                        <Text style={styles.cookingActionAppliance}>
                          {getApplianceById(cookingAction.applianceId)?.name}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {recipe.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          onPress={handleSaveRecipe}
          disabled={isSaving}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Create This Recipe</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onPress={handleToastPress}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

function getMatchColor(percentage: number, theme: any): string {
  if (percentage >= 80) return theme.colors.success.main;
  if (percentage >= 60) return theme.colors.warning.main;
  return theme.colors.error.main;
}
