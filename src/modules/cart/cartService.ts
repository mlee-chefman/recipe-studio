/**
 * Cart Service - Firebase Firestore Integration
 * Manages grocery cart data in Firebase
 *
 * Firestore Structure:
 * users/{userId}/groceryCart (single document)
 *   ├── items: CartItem[]
 *   ├── totalItems: number
 *   ├── recipeIds: string[]
 *   ├── updatedAt: timestamp
 *
 * Note: Firestore automatically creates the collection/document on first write
 * You don't need to manually create anything in Firebase Console
 */

import { db } from '@services/firebase';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { CartItem, GroceryCart } from '~/types/shopping';

/**
 * Sanitize cart item for Firebase
 * Removes undefined values as Firebase doesn't support them
 */
function sanitizeCartItem(item: CartItem): any {
  const sanitized: any = {
    id: item.id,
    recipeId: item.recipeId,
    recipeName: item.recipeName,
    recipeServings: item.recipeServings,
    recipeOriginalServings: item.recipeOriginalServings,
    ingredient: item.ingredient,
    name: item.name,
    selected: item.selected,
    addedAt: item.addedAt,
  };

  // Only add optional fields if they're defined
  if (item.recipeImage !== undefined) {
    sanitized.recipeImage = item.recipeImage;
  }
  if (item.quantity !== undefined) {
    sanitized.quantity = item.quantity;
  }
  if (item.unit !== undefined) {
    sanitized.unit = item.unit;
  }

  return sanitized;
}

/**
 * Get user's grocery cart from Firestore
 * Returns empty cart if doesn't exist yet
 */
export async function getCart(userId: string): Promise<GroceryCart> {
  try {
    const cartRef = doc(db, 'users', userId, 'groceryCart', 'current');
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      const data = cartSnap.data();
      return {
        items: data.items || [],
        totalItems: data.totalItems || 0,
        recipeIds: data.recipeIds || [],
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
      };
    }

    // Return empty cart if doesn't exist yet
    return {
      items: [],
      totalItems: 0,
      recipeIds: [],
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw new Error('Failed to fetch grocery cart');
  }
}

/**
 * Update entire cart in Firestore
 * Replaces existing cart data
 */
export async function updateCart(userId: string, cart: Omit<GroceryCart, 'updatedAt'>): Promise<void> {
  try {
    const cartRef = doc(db, 'users', userId, 'groceryCart', 'current');

    // Sanitize all items to remove undefined values
    const sanitizedItems = cart.items.map(sanitizeCartItem);

    await setDoc(cartRef, {
      items: sanitizedItems,
      totalItems: cart.totalItems,
      recipeIds: cart.recipeIds,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    throw new Error('Failed to update grocery cart');
  }
}

/**
 * Add items to cart
 * Appends new items to existing cart
 */
export async function addItemsToCart(userId: string, newItems: CartItem[]): Promise<void> {
  try {
    const cart = await getCart(userId);

    const updatedItems = [...cart.items, ...newItems];
    const uniqueRecipeIds = Array.from(
      new Set(updatedItems.map(item => item.recipeId))
    );

    await updateCart(userId, {
      items: updatedItems,
      totalItems: updatedItems.length,
      recipeIds: uniqueRecipeIds,
    });
  } catch (error) {
    console.error('Error adding items to cart:', error);
    throw new Error('Failed to add items to cart');
  }
}

/**
 * Remove a single item from cart by ID
 */
export async function removeItemFromCart(userId: string, itemId: string): Promise<void> {
  try {
    const cart = await getCart(userId);

    const updatedItems = cart.items.filter(item => item.id !== itemId);
    const uniqueRecipeIds = Array.from(
      new Set(updatedItems.map(item => item.recipeId))
    );

    await updateCart(userId, {
      items: updatedItems,
      totalItems: updatedItems.length,
      recipeIds: uniqueRecipeIds,
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    throw new Error('Failed to remove item from cart');
  }
}

/**
 * Remove all items from a specific recipe
 */
export async function removeRecipeFromCart(userId: string, recipeId: string): Promise<void> {
  try {
    const cart = await getCart(userId);

    const updatedItems = cart.items.filter(item => item.recipeId !== recipeId);
    const uniqueRecipeIds = Array.from(
      new Set(updatedItems.map(item => item.recipeId))
    );

    await updateCart(userId, {
      items: updatedItems,
      totalItems: updatedItems.length,
      recipeIds: uniqueRecipeIds,
    });
  } catch (error) {
    console.error('Error removing recipe from cart:', error);
    throw new Error('Failed to remove recipe from cart');
  }
}

/**
 * Update quantity of a specific item
 */
export async function updateItemQuantity(
  userId: string,
  itemId: string,
  quantity: number
): Promise<void> {
  try {
    const cart = await getCart(userId);

    const updatedItems = cart.items.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity };
      }
      return item;
    });

    await updateCart(userId, {
      items: updatedItems,
      totalItems: updatedItems.length,
      recipeIds: cart.recipeIds,
    });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    throw new Error('Failed to update item quantity');
  }
}

/**
 * Clear entire cart
 */
export async function clearCart(userId: string): Promise<void> {
  try {
    await updateCart(userId, {
      items: [],
      totalItems: 0,
      recipeIds: [],
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw new Error('Failed to clear cart');
  }
}

/**
 * Get items for a specific recipe
 */
export async function getItemsByRecipe(userId: string, recipeId: string): Promise<CartItem[]> {
  try {
    const cart = await getCart(userId);
    return cart.items.filter(item => item.recipeId === recipeId);
  } catch (error) {
    console.error('Error getting items by recipe:', error);
    throw new Error('Failed to get recipe items');
  }
}

/**
 * Get count of unique recipes in cart
 */
export async function getRecipeCount(userId: string): Promise<number> {
  try {
    const cart = await getCart(userId);
    return cart.recipeIds.length;
  } catch (error) {
    console.error('Error getting recipe count:', error);
    throw new Error('Failed to get recipe count');
  }
}
