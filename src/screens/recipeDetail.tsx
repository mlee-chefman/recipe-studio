import { useLayoutEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useRecipeStore, useAuthStore, useCartStore } from '@store/store';
import { Toast } from '@components/Toast';
import { Recipe } from '~/types/recipe';
import { getApplianceById, getApplianceProductUrl } from '~/types/chefiq';
import { getCookingMethodIcon, formatKeyParameters } from '@utils/cookingActionHelpers';
import { generateExportJSON } from '@utils/chefiqExport';
import { ChefIQExportModal } from '@components/modals';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import StepImage from '@components/StepImage';
import { useIngredientImages } from '@hooks/useIngredientImages';
import { instacartService } from '@services/instacart.service';
import { haptics } from '@utils/haptics';
import type { SelectableIngredient } from '~/types/shopping';
import { formatCookTime } from '@utils/timeFormatter';

type RootStackParamList = {
  RecipeDetail: { recipe: Recipe };
  RecipeEdit: { recipe: Recipe };
};

type RecipeDetailRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;

const HEADER_HEIGHT = 180;

export default function RecipeDetailScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const route = useRoute<RecipeDetailRouteProp>();
  const { recipe: routeRecipe } = route.params;
  const { allRecipes, userRecipes } = useRecipeStore();
  const { user } = useAuthStore();
  const { addItems: addItemsToCart, isRecipeInCart } = useCartStore();

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportJSON, setExportJSON] = useState('');

  // Description expand/collapse state
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Get the latest recipe data from store instead of route params
  // Check both allRecipes and userRecipes arrays
  const recipe = allRecipes.find(r => r.id === routeRecipe.id) ||
                 userRecipes.find(r => r.id === routeRecipe.id) ||
                 routeRecipe;

  // Serving size adjustment state
  const [currentServings, setCurrentServings] = useState(recipe.servings);
  const [scaledIngredients, setScaledIngredients] = useState<string[]>(recipe.ingredients);

  // Ingredient selection state for shopping cart
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(
    new Set(recipe.ingredients.map((_, index) => index)) // All selected by default
  );

  // Load ingredient images (fully parallel, super fast!)
  // Use ORIGINAL ingredients for image lookup (images don't change when servings change)
  const { images: ingredientImages, loading: imagesLoading, loadedCount } = useIngredientImages(
    recipe.ingredients,
    true // enabled
  );

  // Check if current user owns this recipe
  const isOwner = user?.uid === recipe.userId;

  // Check if recipe is already in cart
  const isInCart = isRecipeInCart(recipe.id);

  // Scale ingredients when servings change
  const handleServingsChange = (newServings: number) => {
    if (newServings < 1) return; // Minimum 1 serving

    // Haptic feedback for servings adjustment
    haptics.light();

    const scale = newServings / recipe.servings;
    const scaled = recipe.ingredients.map(ingredient => {
      const parsed = instacartService.parseIngredient(ingredient);

      if (parsed.quantity) {
        const newQuantity = parsed.quantity * scale;
        const formattedQuantity = instacartService.formatQuantity(newQuantity);

        // Reconstruct ingredient string with new quantity
        const parts = [];
        parts.push(formattedQuantity);
        if (parsed.unit) parts.push(parsed.unit);
        parts.push(parsed.name);

        return parts.join(' ');
      }

      return ingredient; // Return unchanged if no quantity
    });

    setCurrentServings(newServings);
    setScaledIngredients(scaled);
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
    setSelectedIngredients(new Set(recipe.ingredients.map((_, index) => index)));
  };

  const deselectAllIngredients = () => {
    setSelectedIngredients(new Set());
  };

  const allSelected = selectedIngredients.size === recipe.ingredients.length;
  const noneSelected = selectedIngredients.size === 0;

  // Add to cart handler
  const handleAddToCart = async () => {
    if (noneSelected) {
      Alert.alert('No Ingredients Selected', 'Please select at least one ingredient to add to cart.');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Sign In Required', 'Please sign in to add items to your cart.');
      return;
    }

    try {
      // Build SelectableIngredient array from selected ingredients
      const selectedIngredientsList: SelectableIngredient[] = Array.from(selectedIngredients)
        .map(index => {
          const ingredientText = scaledIngredients[index];
          const parsed = instacartService.parseIngredient(ingredientText);

          return {
            id: `${recipe.id}-${index}`,
            original: ingredientText,
            quantity: parsed.quantity,
            unit: parsed.unit,
            name: parsed.name,
            notes: parsed.notes,
            selected: true,
          };
        });

      // Convert to CartItems for Firebase storage
      const cartItems = selectedIngredientsList.map(ingredient => ({
        id: ingredient.id,
        recipeId: recipe.id,
        recipeName: recipe.title,
        recipeImage: recipe.image,
        recipeServings: currentServings,
        recipeOriginalServings: recipe.servings,
        ingredient: ingredient.original,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        name: ingredient.name,
        selected: true,
        addedAt: Date.now(),
      }));

      // Save to Firebase cart (with optimistic update)
      await addItemsToCart(cartItems, user.uid);

      // Show toast notification instead of navigating
      setToastMessage(`${selectedIngredientsList.length} ${selectedIngredientsList.length === 1 ? 'ingredient' : 'ingredients'} added to cart`);
      setToastVisible(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
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

  const handleEdit = () => {
    // @ts-ignore - Navigation typing issue with static navigation
    navigation.navigate('RecipeEdit', { recipe });
  };

  const handleExportToChefIQ = async () => {
    try {
      // Generate export
      const json = generateExportJSON(recipe);
      setExportJSON(json);
      setShowExportModal(true);
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export recipe'
      );
    }
  };

  // Configure navigation header - transparent
  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
      headerStyle: {
        backgroundColor: 'transparent',
      },
      headerTransparent: true,
      headerTintColor: '#FFFFFF',
      headerShadowVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Feather
            name="arrow-left"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      ),
      headerRight: () => isOwner ? (
        <TouchableOpacity
          onPress={handleEdit}
          style={styles.headerButton}
        >
          <Feather
            name="edit-3"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      ) : null,
    });
  }, [navigation, recipe, handleEdit, isOwner]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image Section with Overlay Card */}
        <View style={styles.heroSection}>
          {recipe.image ? (
            <Image
              source={{ uri: recipe.image }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder, { backgroundColor: theme.colors.gray[200] }]}>
              <Text style={{ fontSize: 80, color: theme.colors.gray[400] }}>🍽️</Text>
            </View>
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.heroGradient}
          />

          {/* Info Card Overlay */}
          <View style={styles.infoCardContainer}>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface.primary }]}>
              {/* Title and Description */}
              <Text style={[styles.recipeTitle, { color: theme.colors.text.primary }]}>{recipe.title}</Text>
              {recipe.description && (
                <View>
                  <Text
                    style={[styles.recipeDescription, { color: theme.colors.text.secondary }]}
                    numberOfLines={descriptionExpanded ? undefined : 2}
                  >
                    {recipe.description}
                  </Text>
                  {recipe.description.length > 100 && (
                    <TouchableOpacity
                      onPress={() => setDescriptionExpanded(!descriptionExpanded)}
                      style={styles.seeMoreButton}
                    >
                      <Text style={[styles.seeMoreText, { color: theme.colors.primary[500] }]}>
                        {descriptionExpanded ? 'Show less' : 'See more'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Stats Row */}
              <View style={styles.statsRow}>
                {/* Cook Time */}
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Text style={styles.statIcon}>⏱️</Text>
                  </View>
                  <View>
                    <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{formatCookTime(recipe.cookTime)}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Cook Time</Text>
                  </View>
                </View>

                {recipe.difficulty && (
                  <>
                    <View style={[styles.statDivider, { backgroundColor: theme.colors.border.main }]} />
                    {/* Difficulty */}
                    <View style={styles.statItem}>
                      <View style={[styles.difficultyBadge, {
                        backgroundColor: recipe.difficulty === 'Easy' ? theme.colors.success.light :
                          recipe.difficulty === 'Medium' ? theme.colors.warning.light : theme.colors.error.light
                      }]}>
                        <Text style={[styles.difficultyText, {
                          color: recipe.difficulty === 'Easy' ? theme.colors.success.dark :
                            recipe.difficulty === 'Medium' ? theme.colors.warning.dark : theme.colors.error.dark
                        }]}>
                          {recipe.difficulty}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* Author Info */}
              {recipe.authorName && (
                <View style={styles.authorSection}>
                  {recipe.authorProfilePicture ? (
                    <Image
                      source={{ uri: recipe.authorProfilePicture }}
                      style={styles.authorAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.authorAvatar, { backgroundColor: theme.colors.primary[100] }]}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary[500] }}>
                        {recipe.authorName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={[styles.authorLabel, { color: theme.colors.text.tertiary }]}>Created by</Text>
                    <Text style={[styles.authorName, { color: theme.colors.text.primary }]}>{recipe.authorName}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="p-4" style={{ paddingTop: HEADER_HEIGHT }}>

          {/* Category */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Category</Text>
            <View className="px-3 py-2 rounded-lg self-start" style={styles.categoryBadge}>
              <Text className="font-medium" style={styles.categoryText}>{recipe.category}</Text>
            </View>
          </View>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <View key={index} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: theme.colors.gray[100] }}>
                    <Text className="text-sm" style={{ color: theme.colors.text.secondary }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ChefIQ Appliance Info */}
          {recipe.chefiqAppliance && (
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>ChefIQ Appliance</Text>

              <View className="p-4 rounded-lg border" style={{
                backgroundColor: theme.colors.primary[50],
                borderColor: theme.colors.primary[200]
              }}>
                <View className="flex-row items-center mb-3">
                  <Image
                    source={{ uri: getApplianceById(recipe.chefiqAppliance)?.picture }}
                    style={styles.applianceImage}
                    contentFit="contain"
                  />
                  <Text className="text-lg font-semibold flex-1" style={{ color: theme.colors.primary[800] }}>
                    {getApplianceById(recipe.chefiqAppliance)?.name}
                  </Text>
                  {recipe.useProbe && (
                    <View className="ml-2 px-2 py-1 rounded-full" style={{ backgroundColor: theme.colors.warning.light }}>
                      <Text className="text-xs font-medium" style={{ color: theme.colors.warning.dark }}>🌡️ Probe</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={handleExportToChefIQ}
                    activeOpacity={0.7}
                    className="flex-1"
                  >
                    <View className="flex-row items-center justify-center py-2.5 px-4 rounded-lg" style={{ backgroundColor: theme.colors.primary[500] }}>
                      <Feather name="download" size={16} color="white" style={{ marginRight: 6 }} />
                      <Text className="text-white font-semibold text-sm">Export</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      const productUrl = getApplianceProductUrl(recipe.chefiqAppliance!);
                      Linking.openURL(productUrl);
                    }}
                    activeOpacity={0.7}
                    className="flex-1"
                  >
                    <View className="flex-row items-center justify-center py-2.5 px-4 rounded-lg" style={{ backgroundColor: theme.colors.success.main }}>
                      <Feather name="shopping-bag" size={16} color="white" style={{ marginRight: 6 }} />
                      <Text className="text-white font-semibold text-sm">Shop</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Ingredients */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>Ingredients</Text>

              {/* Servings Adjustment Control */}
              <View style={styles.servingsAdjustment}>
                <Text style={[styles.servingsLabel, { color: theme.colors.text.secondary }]}>Servings:</Text>
                <View style={styles.servingsControls}>
                  <TouchableOpacity
                    onPress={() => handleServingsChange(currentServings - 1)}
                    disabled={currentServings <= 1}
                    style={[
                      styles.servingsButton,
                      { backgroundColor: theme.colors.primary[100] },
                      currentServings <= 1 && styles.servingsButtonDisabled
                    ]}
                  >
                    <Feather
                      name="minus"
                      size={16}
                      color={currentServings <= 1 ? theme.colors.gray[400] : theme.colors.primary[600]}
                    />
                  </TouchableOpacity>

                  <Text style={[styles.servingsValue, { color: theme.colors.text.primary }]}>
                    {currentServings}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleServingsChange(currentServings + 1)}
                    style={[styles.servingsButton, { backgroundColor: theme.colors.primary[100] }]}
                  >
                    <Feather name="plus" size={16} color={theme.colors.primary[600]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Select All / None Controls */}
            <View className="flex-row items-center justify-between mb-3 px-2">
              <Text style={[styles.selectionCount, { color: theme.colors.text.tertiary }]}>
                {selectedIngredients.size} of {recipe.ingredients.length} selected
              </Text>
              <View className="flex-row gap-2">
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
                    { color: allSelected ? theme.colors.text.tertiary : theme.colors.primary[600] }
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
                    { color: noneSelected ? theme.colors.text.tertiary : theme.colors.primary[600] }
                  ]}>
                    Clear All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.background.secondary }}>
              {scaledIngredients.map((ingredient, index) => {
                // Look up image using ORIGINAL ingredient (images are keyed by original ingredients)
                const originalIngredient = recipe.ingredients[index];
                const imageUrl = ingredientImages.get(originalIngredient);
                const isLoading = imagesLoading && !imageUrl;
                const isSelected = selectedIngredients.has(index);

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleIngredient(index)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center mb-3">
                      {/* Checkbox */}
                      <TouchableOpacity
                        onPress={() => toggleIngredient(index)}
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isSelected ? theme.colors.primary[500] : theme.colors.gray[300],
                            backgroundColor: isSelected ? theme.colors.primary[500] : 'transparent'
                          }
                        ]}
                      >
                        {isSelected && (
                          <Feather name="check" size={14} color="white" />
                        )}
                      </TouchableOpacity>

                      {/* Ingredient Image Container (fixed size for alignment) */}
                      <View style={styles.ingredientImageContainer}>
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.ingredientImage}
                            contentFit="contain"
                          />
                        ) : isLoading ? (
                          <View style={styles.ingredientImagePlaceholder}>
                            <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                          </View>
                        ) : (
                          <View style={[styles.ingredientBulletContainer, { backgroundColor: theme.colors.background.secondary }]}>
                            <View className="w-2 h-2 rounded-full" style={styles.ingredientBullet} />
                          </View>
                        )}
                      </View>

                      {/* Ingredient Text (displays scaled quantity) */}
                      <Text className="text-base flex-1" style={{ color: theme.colors.text.secondary }}>
                        {ingredient}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add to Cart Button */}
            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={noneSelected || isInCart}
              className="mt-4 flex-row items-center justify-center py-4 rounded-lg"
              style={[
                styles.addToCartButton,
                (noneSelected || isInCart) && styles.addToCartButtonDisabled
              ]}
            >
              <Feather
                name={isInCart ? "check-circle" : "shopping-cart"}
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white font-semibold text-base">
                {isInCart
                  ? 'Added to Cart'
                  : `Add to Cart (${selectedIngredients.size} ${selectedIngredients.size === 1 ? 'item' : 'items'})`
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.text.primary }}>Instructions</Text>
            <View className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.background.secondary }}>
              {recipe.steps.map((step, index) => {
                const cookingAction = step.cookingAction;
                const stepImage = step.image;

                return (
                  <View key={index} className="mb-4">
                    <View className="flex-row mb-2">
                      <View className="rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5" style={styles.stepNumberBadge}>
                        <Text className="text-white text-sm font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-base leading-6 flex-1" style={{ color: theme.colors.text.secondary }}>{step.text}</Text>

                      {/* Step Image - inline */}
                      {stepImage && (
                        <View className="ml-2">
                          <StepImage imageUri={stepImage} editable={false} compact={true} />
                        </View>
                      )}
                    </View>

                    {/* Cooking Action for this step */}
                    {cookingAction && (
                      <View className="ml-9 border rounded-lg p-3" style={{
                        backgroundColor: theme.colors.primary[50],
                        borderColor: theme.colors.primary[200]
                      }}>
                        <View className="flex-row items-center">
                          <Text className="text-lg mr-2">
                            {getCookingMethodIcon(
                              cookingAction.methodId,
                              getApplianceById(cookingAction.applianceId)?.thing_category_name
                            )}
                          </Text>
                          <View className="flex-1">
                            <Text className="text-sm font-medium" style={{ color: theme.colors.primary[800] }}>
                              {cookingAction.methodName}
                            </Text>
                            <Text className="text-xs mt-1" style={{ color: theme.colors.primary[600] }}>
                              {formatKeyParameters(cookingAction)}
                            </Text>
                            <Text className="text-xs mt-0.5" style={{ color: theme.colors.primary[500] }}>
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
          </View>
        </View>
      </ScrollView>

      {/* Export Modal */}
      <ChefIQExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportJSON={exportJSON}
        recipeName={recipe.title}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onPress={handleToastPress}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  headerButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    ...theme.shadows.md,
  },
  heroSection: {
    position: 'relative',
    width: '100%',
    height: 500,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  infoCardContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -HEADER_HEIGHT,
    paddingHorizontal: 16,
  },
  infoCard: {
    borderRadius: 20,
    padding: 16,
    ...theme.shadows.xl,
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  recipeDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  seeMoreButton: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    marginBottom: 8,
  },
  seeMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statIconContainer: {
    marginRight: 6,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorLabel: {
    fontSize: 10,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary[100],
  },
  categoryText: {
    color: theme.colors.primary[600],
  },
  applianceImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  exportIconButton: {
    backgroundColor: theme.colors.primary[500],
  },
  ingredientBullet: {
    backgroundColor: theme.colors.primary[500],
  },
  ingredientImageContainer: {
    width: 32,
    height: 32,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: theme.colors.gray[100],
  },
  ingredientImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientBulletContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberBadge: {
    backgroundColor: theme.colors.primary[500],
  },
  servingsAdjustment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servingsLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servingsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsButtonDisabled: {
    opacity: 0.4,
  },
  servingsValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  resetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.primary[50],
  },
  selectionButtonDisabled: {
    opacity: 0.5,
  },
  selectionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButton: {
    backgroundColor: theme.colors.success.main,
    ...theme.shadows.md,
  },
  addToCartButtonDisabled: {
    backgroundColor: theme.colors.gray[400],
    opacity: 0.6,
  },
});
