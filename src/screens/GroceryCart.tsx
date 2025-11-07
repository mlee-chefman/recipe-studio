import React, { useEffect, useState, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import { useAuthStore, useCartStore } from '@store/store';
import { instacartService } from '@services/instacart.service';
import { ConfirmationModal } from '@components/modals';
import { useIngredientImages } from '@hooks/useIngredientImages';
import type { Theme } from '@theme/index';
import type { CartItem } from '~/types/shopping';

export default function GroceryCartScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const {
    items,
    totalItems,
    recipeIds,
    isLoading,
    error,
    fetchCart,
    removeItem,
    removeRecipeItems,
    updateItemQuantity,
    toggleItemSelection,
    updateRecipeServings,
    clearCart,
    getItemsByRecipe,
  } = useCartStore();

  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);

  // Track expanded/collapsed recipes (all expanded by default)
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(
    new Set(recipeIds)
  );

  // Update expanded recipes when cart changes
  useEffect(() => {
    setExpandedRecipes(new Set(recipeIds));
  }, [recipeIds]);

  // Toggle recipe expand/collapse
  const toggleRecipe = (recipeId: string) => {
    setExpandedRecipes(prev => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      return next;
    });
  };

  // Unified confirmation modal state
  type ConfirmationType = 'removeItem' | 'removeRecipe' | 'clearCart' | null;
  const [confirmationType, setConfirmationType] = useState<ConfirmationType>(null);
  const [confirmationData, setConfirmationData] = useState<{
    itemId?: string;
    recipeId?: string;
    recipeName?: string;
  }>({});

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Grocery Cart',
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: {
        fontWeight: theme.typography.fontWeight.semibold,
        fontSize: theme.typography.fontSize.lg,
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setConfirmationType('clearCart')}
          style={{ paddingRight: 16 }}
        >
          <Text style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: '600',
            color: theme.colors.error.main,
          }}>
            Clear
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  // Fetch cart on mount
  useEffect(() => {
    if (user?.uid) {
      fetchCart(user.uid);
    }
  }, [user?.uid]);

  // Group items by recipe
  const itemsByRecipe = useMemo(() => {
    const grouped = new Map<string, CartItem[]>();
    items.forEach(item => {
      const recipeItems = grouped.get(item.recipeId) || [];
      recipeItems.push(item);
      grouped.set(item.recipeId, recipeItems);
    });
    return grouped;
  }, [items]);

  // Get all unique ingredient strings for image loading
  const allIngredients = useMemo(() => {
    return items.map(item => item.ingredient);
  }, [items]);

  // Load ingredient images with caching and progressive loading
  const { images: ingredientImages, loading: imagesLoading } = useIngredientImages(
    allIngredients,
    true, // enabled
    5,    // batchSize
    1000  // delayMs
  );

  // Handle remove item
  const handleRemoveItem = (itemId: string) => {
    setConfirmationType('removeItem');
    setConfirmationData({ itemId });
  };

  // Handle remove entire recipe
  const handleRemoveRecipe = (recipeId: string, recipeName: string) => {
    setConfirmationType('removeRecipe');
    setConfirmationData({ recipeId, recipeName });
  };

  // Handle clear cart
  const handleClearCart = () => {
    setConfirmationType('clearCart');
  };

  // Unified confirmation handler
  const handleConfirm = async () => {
    if (!user?.uid) return;

    const type = confirmationType;
    setConfirmationType(null);

    try {
      switch (type) {
        case 'removeItem':
          if (confirmationData.itemId) {
            await removeItem(confirmationData.itemId, user.uid);
          }
          break;
        case 'removeRecipe':
          if (confirmationData.recipeId) {
            await removeRecipeItems(confirmationData.recipeId, user.uid);
          }
          break;
        case 'clearCart':
          await clearCart(user.uid);
          break;
      }
      setConfirmationData({});
    } catch (error) {
      console.error('Error performing action:', error);
      Alert.alert('Error', 'Failed to perform action. Please try again.');
    }
  };

  // Get modal config based on confirmation type
  const getModalConfig = () => {
    switch (confirmationType) {
      case 'removeItem':
        return {
          title: 'Remove Item?',
          message: 'Are you sure you want to remove this item from your cart?',
          confirmText: 'Remove',
        };
      case 'removeRecipe':
        const itemCount = confirmationData.recipeId
          ? getItemsByRecipe(confirmationData.recipeId).length
          : 0;
        return {
          title: 'Remove Recipe?',
          message: `Remove all ${itemCount} ${itemCount === 1 ? 'item' : 'items'} from "${confirmationData.recipeName}"?`,
          confirmText: 'Remove All',
        };
      case 'clearCart':
        return {
          title: 'Clear Cart?',
          message: `Remove all ${totalItems} ${totalItems === 1 ? 'item' : 'items'} from your cart?`,
          confirmText: 'Clear All',
        };
      default:
        return {
          title: '',
          message: '',
          confirmText: 'Confirm',
        };
    }
  };

  // Handle shop on Instacart
  const handleShopOnInstacart = async () => {
    if (!user?.uid || totalItems === 0) return;

    // Filter only selected items
    const selectedItems = items.filter(item => item.selected);
    if (selectedItems.length === 0) {
      Alert.alert(
        'No Items Selected',
        'Please select at least one ingredient to shop on Instacart.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsGeneratingUrl(true);

    try {
      // Convert selected cart items to SelectableIngredient format
      const selectableIngredients = selectedItems.map(item => ({
        id: item.id,
        original: item.ingredient,
        quantity: item.quantity,
        unit: item.unit,
        name: item.name,
        selected: true,
      }));

      // Get unique recipe IDs and names from selected items only
      const selectedRecipeIds = Array.from(
        new Set(selectedItems.map(item => item.recipeId))
      );
      const uniqueRecipeNames = Array.from(
        new Set(selectedItems.map(item => item.recipeName))
      );

      // Create shopping list
      const shoppingList = instacartService.createShoppingList(
        selectedRecipeIds,
        uniqueRecipeNames,
        selectableIngredients
      );

      // Generate Instacart URL (now async - uploads JSON to Firebase Storage)
      const instacartUrl = await instacartService.generateInstacartUrl(shoppingList);

      console.log('Opening Instacart URL:', instacartUrl);

      // Open Instacart URL
      const supported = await Linking.canOpenURL(instacartUrl);
      if (supported) {
        await Linking.openURL(instacartUrl);
      } else {
        Alert.alert(
          'Cannot Open Instacart',
          'Unable to open Instacart. Please make sure you have the Instacart app installed or try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening Instacart:', error);
      Alert.alert(
        'Error',
        'Failed to open Instacart. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </View>
    );
  }

  // Empty cart state
  if (totalItems === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={64} color={theme.colors.gray[300]} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add ingredients from recipes to start shopping
          </Text>
          <TouchableOpacity
            style={styles.browseRecipesButton}
            onPress={() => {
              // Pop back to the previous screen (Settings)
              // Then navigate to Home tab
              navigation.goBack();
              setTimeout(() => {
                // @ts-ignore
                navigation.navigate('TabNavigator', { screen: 'Home' });
              }, 100);
            }}
          >
            <Feather name="book-open" size={20} color="#fff" />
            <Text style={styles.browseRecipesButtonText}>Browse Recipes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Cart Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {items.filter(i => i.selected).length} of {totalItems} {totalItems === 1 ? 'item' : 'items'} selected from {recipeIds.length} {recipeIds.length === 1 ? 'recipe' : 'recipes'}
        </Text>
      </View>

      {/* Items List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {Array.from(itemsByRecipe.entries()).map(([recipeId, recipeItems]) => {
          const recipeName = recipeItems[0].recipeName;
          const recipeImage = recipeItems[0].recipeImage;
          const recipeServings = recipeItems[0].recipeServings;
          const isExpanded = expandedRecipes.has(recipeId);

          const handleServingsChange = async (newServings: number) => {
            if (newServings < 1 || !user?.uid) return;
            try {
              await updateRecipeServings(recipeId, newServings, user.uid);
            } catch (error) {
              console.error('Error updating servings:', error);
            }
          };

          return (
            <View key={recipeId} style={styles.recipeSection}>
              {/* Recipe Header - Tappable to expand/collapse */}
              <TouchableOpacity
                style={styles.recipeHeader}
                onPress={() => toggleRecipe(recipeId)}
                activeOpacity={0.7}
              >
                <View style={styles.recipeHeaderLeft}>
                  {/* Recipe Thumbnail Image */}
                  {recipeImage ? (
                    <Image
                      source={{ uri: recipeImage }}
                      style={styles.recipeImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.recipeImagePlaceholder}>
                      <Feather name="book-open" size={20} color={theme.colors.primary.main} />
                    </View>
                  )}

                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName} numberOfLines={2}>
                      {recipeName}
                    </Text>
                    <Text style={styles.recipeItemCount}>
                      {recipeItems.length} {recipeItems.length === 1 ? 'ingredient' : 'ingredients'}
                    </Text>
                  </View>
                </View>

                <View style={styles.recipeHeaderRight}>
                  {/* Servings Adjustment */}
                  <View style={styles.servingsControls}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleServingsChange(recipeServings - 1);
                      }}
                      disabled={recipeServings <= 1}
                      style={[
                        styles.servingsButton,
                        recipeServings <= 1 && styles.servingsButtonDisabled
                      ]}
                    >
                      <Feather
                        name="minus"
                        size={14}
                        color={recipeServings <= 1 ? theme.colors.gray[400] : theme.colors.primary[600]}
                      />
                    </TouchableOpacity>

                    <Text style={styles.servingsValue}>{recipeServings}</Text>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleServingsChange(recipeServings + 1);
                      }}
                      style={styles.servingsButton}
                    >
                      <Feather name="plus" size={14} color={theme.colors.primary[600]} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemoveRecipe(recipeId, recipeName);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.removeRecipeButton}
                  >
                    <Feather name="trash-2" size={16} color={theme.colors.error.main} />
                  </TouchableOpacity>

                  {/* Expand/Collapse Icon */}
                  <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.colors.text.tertiary}
                  />
                </View>
              </TouchableOpacity>

              {/* Items - Only show when expanded */}
              {isExpanded && recipeItems.map((item) => {
                const imageUrl = ingredientImages.get(item.ingredient);
                const isImageLoading = imagesLoading && !imageUrl;

                const handleToggleSelection = async () => {
                  if (!user?.uid) return;
                  try {
                    await toggleItemSelection(item.id, user.uid);
                  } catch (error) {
                    console.error('Error toggling selection:', error);
                  }
                };

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    onPress={handleToggleSelection}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemLeft}>
                      {/* Checkbox */}
                      <TouchableOpacity
                        onPress={handleToggleSelection}
                        style={[
                          styles.checkbox,
                          {
                            borderColor: item.selected ? theme.colors.primary[500] : theme.colors.gray[300],
                            backgroundColor: item.selected ? theme.colors.primary[500] : 'transparent'
                          }
                        ]}
                      >
                        {item.selected && (
                          <Feather name="check" size={12} color="white" />
                        )}
                      </TouchableOpacity>

                      {/* Ingredient Image or Bullet */}
                      <View style={styles.ingredientImageContainer}>
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.ingredientImage}
                            contentFit="cover"
                          />
                        ) : isImageLoading ? (
                          <View style={styles.ingredientImagePlaceholder}>
                            <ActivityIndicator size="small" color={theme.colors.primary.main} />
                          </View>
                        ) : (
                          <View style={styles.ingredientBulletContainer}>
                            <View style={styles.itemBullet} />
                          </View>
                        )}
                      </View>

                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, !item.selected && styles.itemNameUnselected]}>
                          {item.name}
                        </Text>
                        {item.quantity && (
                          <Text style={styles.itemDetails}>
                            {instacartService.formatQuantity(item.quantity)}
                            {item.unit && ` ${item.unit}`}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* Shop on Instacart Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          onPress={handleShopOnInstacart}
          disabled={isGeneratingUrl || totalItems === 0}
          style={[
            styles.shopButton,
            (isGeneratingUrl || totalItems === 0) && styles.shopButtonDisabled,
          ]}
        >
          {isGeneratingUrl ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.shopButtonText}>Opening Instacart...</Text>
            </>
          ) : (
            <>
              <Feather name="shopping-bag" size={20} color="#fff" />
              <Text style={styles.shopButtonText}>Shop on Instacart</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Unified Confirmation Modal */}
      <ConfirmationModal
        visible={confirmationType !== null}
        title={getModalConfig().title}
        message={getModalConfig().message}
        confirmText={getModalConfig().confirmText}
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmationType(null);
          setConfirmationData({});
        }}
      />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  browseRecipesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.md,
  },
  browseRecipesButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: '#fff',
  },
  summaryContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  recipeSection: {
    marginBottom: theme.spacing.lg,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  recipeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  recipeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  recipeImage: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[100],
  },
  recipeImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  recipeItemCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  removeRecipeButton: {
    padding: theme.spacing.xs,
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  servingsButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsButtonDisabled: {
    opacity: 0.4,
  },
  servingsValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    minWidth: 20,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  ingredientImageContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientImage: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
  },
  ingredientImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientBulletContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.sm,
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.main,
  },
  itemInfo: {
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 1,
  },
  itemNameUnselected: {
    color: theme.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  itemDetails: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
    ...theme.shadows.lg,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.success.main,
    ...theme.shadows.md,
  },
  shopButtonDisabled: {
    backgroundColor: theme.colors.gray[400],
    opacity: 0.6,
  },
  shopButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: '#fff',
  },
});
