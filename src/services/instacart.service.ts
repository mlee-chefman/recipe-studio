// Instacart shopping cart service
// Generates Instacart cart links with selected ingredients

import { Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import {
  ShoppingLineItem,
  ShoppingList,
  InstacartCartParams,
  INSTACART_CONFIG,
  INSTACART_INGREDIENT_UNITS,
  SelectableIngredient,
  CombinedIngredient,
  ParsedIngredient,
} from '../types/shopping';
import { simplifyIngredientNamesBatch } from './ingredientSimplifier.service';

// Instacart API configuration
const INSTACART_API_KEY = process.env.EXPO_PUBLIC_INSTACART_API_KEY;

// DEMO APP CONFIGURATION - ALWAYS USE SANDBOX/TEST ENDPOINT
// This app is configured for demo/testing purposes only
// Both debug and release builds use the sandbox environment
//
// Sandbox endpoint: connect.dev.instacart.tools (test environment)
// Production endpoint: connect.instacart.com (DO NOT USE for demo)
//
// Expected API key format: ic_test_xxxxx (for sandbox) or keys.xxxxx (development keys)
// DO NOT use ic_prod_xxxxx keys in this demo app
const INSTACART_IDP_ENDPOINT = 'https://connect.dev.instacart.tools/idp/v1/products/products_link';

/**
 * Instacart Service
 * Handles shopping cart link generation and ingredient parsing
 */
class InstacartService {
  /**
   * Parse ingredient string into structured format
   * Examples:
   *   "2 cups flour" -> {quantity: 2, unit: "cups", name: "flour"}
   *   "1/2 teaspoon salt" -> {quantity: 0.5, unit: "teaspoon", name: "salt"}
   *   "3 large eggs" -> {quantity: 3, unit: "large", name: "eggs"}
   *   "2 (6-ounce) cans tomatoes" -> {quantity: 2, unit: "cans", name: "(6-ounce) tomatoes"}
   */
  parseIngredient(ingredientText: string): ParsedIngredient {
    const original = ingredientText.trim();

    // Extract quantity from the beginning (handles fractions like "1/2" or "2 1/2")
    const quantityRegex = /^(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)\s*/;
    const quantityMatch = original.match(quantityRegex);

    let quantity: number | undefined;
    let remainingText = original;

    if (quantityMatch) {
      const quantityStr = quantityMatch[1];
      quantity = this.parseQuantity(quantityStr.trim());
      remainingText = original.slice(quantityMatch[0].length);
    }

    // If no quantity found, return entire string as name
    if (!quantity) {
      return {
        original,
        name: original,
      };
    }

    // Try to find a valid unit in the remaining text
    // Check each valid unit to see if it appears at the start of remainingText
    let unit: string | undefined;
    let name: string = remainingText;

    // Sort units by length (longest first) to match more specific units first
    // e.g., "tablespoons" before "tablespoon", "fluid ounces" before "ounces"
    const sortedUnits = [...INSTACART_INGREDIENT_UNITS].sort((a, b) => b.length - a.length);

    for (const possibleUnit of sortedUnits) {
      // Check if remaining text starts with this unit (case-insensitive)
      const unitRegex = new RegExp(`^${possibleUnit}(?:\\s+|$)`, 'i');
      const unitMatch = remainingText.match(unitRegex);

      if (unitMatch) {
        unit = possibleUnit;
        name = remainingText.slice(unitMatch[0].length).trim();
        break;
      }
    }

    // If no name found after unit, use remaining text as name
    if (!name && remainingText) {
      name = remainingText;
    }

    return {
      original,
      quantity,
      unit,
      name,
    };
  }

  /**
   * Parse quantity string to number
   * Handles: "2", "1/2", "2 1/2", "0.5"
   */
  private parseQuantity(quantityStr: string): number {
    // Handle mixed fractions like "2 1/2"
    if (quantityStr.includes(' ')) {
      const [whole, fraction] = quantityStr.split(' ');
      return parseFloat(whole) + this.parseFraction(fraction);
    }

    // Handle simple fractions like "1/2"
    if (quantityStr.includes('/')) {
      return this.parseFraction(quantityStr);
    }

    // Handle decimals like "0.5"
    return parseFloat(quantityStr);
  }

  /**
   * Parse fraction string to decimal
   * "1/2" -> 0.5, "3/4" -> 0.75
   */
  private parseFraction(fraction: string): number {
    const [numerator, denominator] = fraction.split('/').map(parseFloat);
    return numerator / denominator;
  }

  /**
   * Format quantity for display
   * 2.5 -> "2 1/2", 0.5 -> "1/2", 3 -> "3"
   */
  formatQuantity(quantity: number): string {
    const whole = Math.floor(quantity);
    const fractional = quantity - whole;

    if (fractional === 0) {
      return whole.toString();
    }

    // Common fractions
    const fractions: { [key: string]: string } = {
      '0.25': '1/4',
      '0.33': '1/3',
      '0.5': '1/2',
      '0.67': '2/3',
      '0.75': '3/4',
    };

    const fractionStr = fractions[fractional.toFixed(2)];

    if (whole === 0) {
      return fractionStr || fractional.toString();
    }

    return fractionStr ? `${whole} ${fractionStr}` : quantity.toString();
  }

  /**
   * Combine duplicate ingredients from multiple recipes
   * Groups by ingredient name + unit and sums quantities
   */
  combineIngredients(ingredients: SelectableIngredient[]): CombinedIngredient[] {
    const grouped = new Map<string, CombinedIngredient>();

    ingredients.forEach(ingredient => {
      // Create key from name + unit (e.g., "flour_cups")
      const key = `${ingredient.name.toLowerCase()}_${ingredient.unit?.toLowerCase() || 'none'}`;

      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.quantities.push(ingredient.quantity || 0);
        existing.totalQuantity += ingredient.quantity || 0;
        // Note: recipeIds would need to be tracked separately if needed
      } else {
        grouped.set(key, {
          original: ingredient.original,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          name: ingredient.name,
          notes: ingredient.notes,
          recipeIds: [], // Would need recipe context to populate
          quantities: [ingredient.quantity || 0],
          totalQuantity: ingredient.quantity || 0,
        });
      }
    });

    return Array.from(grouped.values());
  }

  /**
   * Convert SelectableIngredient to ShoppingLineItem
   * Validates unit against Instacart's accepted units
   */
  toShoppingLineItem(ingredient: SelectableIngredient | CombinedIngredient): ShoppingLineItem {
    const { quantity, unit, name, original } = ingredient;

    // Validate unit is accepted by Instacart
    const validUnit = unit && INSTACART_INGREDIENT_UNITS.includes(unit.toLowerCase() as any)
      ? (unit as any)
      : undefined;

    // Create display text
    const displayParts: string[] = [];
    if (quantity) {
      displayParts.push(this.formatQuantity(quantity));
    }
    if (validUnit) {
      displayParts.push(validUnit);
    }
    displayParts.push(name);

    return {
      name,
      quantity: quantity ? parseFloat(quantity.toFixed(2)) : undefined,
      unit: validUnit,
      display_text: displayParts.join(' '),
    };
  }

  /**
   * Create shopping list from selected ingredients
   */
  createShoppingList(
    recipeIds: string[],
    recipeTitles: string[],
    selectedIngredients: SelectableIngredient[]
  ): ShoppingList {
    // Combine duplicate ingredients
    const combined = this.combineIngredients(selectedIngredients);

    // Convert to shopping line items
    const items = combined.map(ingredient => this.toShoppingLineItem(ingredient));

    return {
      recipeIds,
      recipeTitles,
      items,
      totalItems: items.length,
    };
  }

  /**
   * Generate recipe title for shopping list
   * Single recipe: "Ingredients for Pasta Carbonara"
   * Multiple recipes: "Ingredients for Pasta Carbonara and 2 more recipes"
   */
  private generateShoppingListTitle(recipeTitles: string[]): string {
    if (recipeTitles.length === 0) {
      return 'Recipe Ingredients';
    }

    if (recipeTitles.length === 1) {
      return `Ingredients for ${recipeTitles[0]}`;
    }

    const remaining = recipeTitles.length - 1;
    const plural = remaining === 1 ? 'recipe' : 'recipes';
    return `Ingredients for ${recipeTitles[0]} and ${remaining} more ${plural}`;
  }

  /**
   * Generate Instacart-compatible shopping list JSON
   * Matches ChefIQ's shopping_list format exactly
   * Reference: chefiq-api-shopping/src/helpers/recipe-mapper.ts
   *
   * Uses Gemini AI to simplify ingredient names for better product matching
   */
  private async generateInstacartRecipeJson(shoppingList: ShoppingList): Promise<string> {
    const { items, recipeTitles } = shoppingList;

    // Simplify ingredient names using Gemini batch API
    // e.g., "2 (6-ounce) salmon fillets, skin on" → "salmon"
    const ingredientNames = items.map(item => item.name);
    console.log('🛒 Simplifying ingredients for Instacart:', ingredientNames);
    const simplifiedNames = await simplifyIngredientNamesBatch(ingredientNames);
    console.log('✅ Simplified ingredients map:', Array.from(simplifiedNames.entries()));

    // Generate title based on number of recipes
    let title: string;
    if (recipeTitles.length === 0) {
      title = 'Shopping List';
    } else if (recipeTitles.length === 1) {
      title = recipeTitles[0];
    } else {
      title = `Shopping List - ${recipeTitles.length} Recipes`;
    }

    // Format matches ChefIQ's InstacartShoppingList format
    const recipeData = {
      title,
      link_type: 'shopping_list',
      expires_in: 1, // days
      landing_page_configuration: {
        enable_pantry_items: true,
      },
      line_items: items.map(item => {
        const simplifiedName = simplifiedNames.get(item.name) || item.name;

        // Build simplified display text with quantity + unit + simplified name
        const displayParts: string[] = [];
        if (item.quantity) {
          displayParts.push(item.quantity.toString());
        }
        if (item.unit) {
          displayParts.push(item.unit);
        }
        displayParts.push(simplifiedName); // Use simplified name instead of original

        // ShoppingLineItem format: quantity and unit at top level (not in measurements array)
        const lineItem: any = {
          name: simplifiedName, // Simplified name for product matching
          display_text: displayParts.join(' '), // Simplified display text
        };

        // Add quantity and unit at top level (ChefIQ shopping_list format)
        if (item.quantity) {
          lineItem.quantity = parseFloat(item.quantity.toFixed(2));
        } else {
          lineItem.quantity = 1; // Default to 1 if no quantity
        }

        if (item.unit) {
          lineItem.unit = item.unit;
        } else {
          lineItem.unit = ''; // Empty string if no unit
        }

        return lineItem;
      }),
    };

    console.log('📦 Final Instacart payload (first 3 items):',
      JSON.stringify(recipeData.line_items.slice(0, 3), null, 2)
    );

    return JSON.stringify(recipeData, null, 2);
  }

  /**
   * Create shopping list on Instacart via IDP API
   * Posts shopping list data to Instacart and gets back a direct link
   * Reference: chefiq-api-shopping/src/helpers/instacart/services/idp-service.ts
   */
  async createInstacartShoppingList(shoppingList: ShoppingList): Promise<string> {
    try {
      if (!INSTACART_API_KEY) {
        throw new Error('Instacart API key not configured. Add EXPO_PUBLIC_INSTACART_API_KEY to .env');
      }

      // Generate shopping list JSON
      const shoppingListData = await this.generateInstacartRecipeJson(shoppingList);
      const parsedData = JSON.parse(shoppingListData);

      // Call Instacart IDP API to create shopping list
      const response = await fetch(INSTACART_IDP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${INSTACART_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Instacart API error:', response.status, errorText);
        throw new Error(`Instacart API error: ${response.status}`);
      }

      const responseData = await response.json();
      const { products_link_url } = responseData;

      if (!products_link_url) {
        console.error('No products_link_url in response:', responseData);
        throw new Error('Invalid response from Instacart API');
      }

      return products_link_url;
    } catch (error) {
      console.error('Error creating Instacart shopping list:', error);
      throw new Error('Failed to create shopping list on Instacart');
    }
  }

  /**
   * Generate Instacart shopping list URL via IDP API
   */
  async generateInstacartUrl(shoppingList: ShoppingList): Promise<string> {
    try {
      // Create shopping list on Instacart and get direct link
      const productsLinkUrl = await this.createInstacartShoppingList(shoppingList);
      return productsLinkUrl;
    } catch (error) {
      console.error('Error generating Instacart URL:', error);
      throw error;
    }
  }

  /**
   * Open Instacart cart with selected ingredients
   * Returns true if successful, false otherwise
   */
  async openInstacartCart(shoppingList: ShoppingList): Promise<boolean> {
    try {
      const url = await this.generateInstacartUrl(shoppingList);
      console.log('🛒 Attempting to open Instacart URL:', url);

      // Check if URL can be opened (works in both debug and release builds)
      const canOpen = await Linking.canOpenURL(url);
      console.log('🔗 Can open URL:', canOpen);

      if (!canOpen) {
        // More detailed error for debugging
        const errorMessage = __DEV__
          ? `Cannot open URL: ${url}\n\nMake sure you have the Instacart app installed or a browser available.`
          : 'Please make sure you have the Instacart app installed or try opening in your browser.\n\nNote: This is a demo app using Instacart sandbox environment.';

        Alert.alert(
          'Cannot Open Instacart Link',
          errorMessage,
          [{ text: 'OK' }]
        );
        return false;
      }

      // Open URL (should work in both debug and release builds)
      await Linking.openURL(url);
      console.log('✅ Successfully opened Instacart URL');
      return true;
    } catch (error) {
      console.error('❌ Error opening Instacart:', error);

      // More helpful error message
      const errorMessage = __DEV__
        ? `Failed to open Instacart.\n\nError: ${error}\n\nEndpoint: ${INSTACART_IDP_ENDPOINT}`
        : 'Failed to open Instacart shopping list. Please try again.\n\nNote: This demo app uses Instacart sandbox/test environment.';

      Alert.alert(
        'Error Opening Instacart',
        errorMessage,
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Validate ingredient has required fields for shopping
   */
  isValidShoppingIngredient(ingredient: SelectableIngredient): boolean {
    return !!(ingredient.name && ingredient.name.trim().length > 0);
  }

  /**
   * Filter and prepare ingredients for shopping
   * Only includes selected and valid ingredients
   */
  prepareIngredientsForShopping(ingredients: SelectableIngredient[]): SelectableIngredient[] {
    return ingredients.filter(
      ingredient => ingredient.selected && this.isValidShoppingIngredient(ingredient)
    );
  }

  /**
   * Scale ingredient quantities based on serving size change
   * originalServings: 4, newServings: 8 -> doubles all quantities
   */
  scaleIngredientQuantities(
    ingredients: SelectableIngredient[],
    originalServings: number,
    newServings: number
  ): SelectableIngredient[] {
    const scale = newServings / originalServings;

    return ingredients.map(ingredient => ({
      ...ingredient,
      quantity: ingredient.quantity ? ingredient.quantity * scale : undefined,
      // Update original text with new quantity
      original: ingredient.quantity
        ? ingredient.original.replace(
            String(ingredient.quantity),
            this.formatQuantity(ingredient.quantity * scale)
          )
        : ingredient.original,
    }));
  }
}

// Export singleton instance
export const instacartService = new InstacartService();
export default instacartService;
