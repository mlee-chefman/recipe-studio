// Instacart shopping cart service
// Generates Instacart cart links with selected ingredients

import { Linking, Alert } from 'react-native';
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
   */
  parseIngredient(ingredientText: string): ParsedIngredient {
    const original = ingredientText.trim();

    // Regular expression to match quantity, unit, and name
    // Matches: "2 1/2 cups flour" or "1/2 cup sugar" or "2 tablespoons butter"
    const regex = /^(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)?(?:\s+)?([\w\s]+?)(?:\s+)(.+)$/;
    const match = original.match(regex);

    if (!match) {
      // If no match, treat entire string as ingredient name
      return {
        original,
        name: original,
      };
    }

    const [, quantityStr, potentialUnit, nameAndRest] = match;

    // Parse quantity (handles fractions like "1/2" or "2 1/2")
    let quantity: number | undefined;
    if (quantityStr) {
      quantity = this.parseQuantity(quantityStr.trim());
    }

    // Check if potentialUnit is a valid Instacart unit
    const unitLower = potentialUnit?.trim().toLowerCase();
    const isValidUnit = unitLower && INSTACART_INGREDIENT_UNITS.includes(unitLower as any);

    let unit: string | undefined;
    let name: string;

    if (isValidUnit) {
      unit = potentialUnit.trim();
      name = nameAndRest.trim();
    } else {
      // Not a valid unit, include it in the name
      name = `${potentialUnit} ${nameAndRest}`.trim();
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
   * Generate Instacart cart URL
   * Creates a deep link to Instacart with shopping items
   */
  generateInstacartUrl(shoppingList: ShoppingList): string {
    const { items, recipeTitles } = shoppingList;
    const title = this.generateShoppingListTitle(recipeTitles);

    // Build query parameters
    const params = new URLSearchParams({
      aff_id: INSTACART_CONFIG.affId,
      offer_id: INSTACART_CONFIG.offerId,
      utm_source: INSTACART_CONFIG.utmSource,
      utm_medium: INSTACART_CONFIG.utmMedium,
      title,
    });

    // Add items as JSON (Instacart API format)
    // Note: This is a simplified version. Actual Instacart API may require different format
    const itemsJson = JSON.stringify(items.map(item => ({
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || '',
    })));

    params.append('items', itemsJson);

    return `${INSTACART_CONFIG.cartBaseUrl}?${params.toString()}`;
  }

  /**
   * Open Instacart cart with selected ingredients
   * Returns true if successful, false otherwise
   */
  async openInstacartCart(shoppingList: ShoppingList): Promise<boolean> {
    try {
      const url = this.generateInstacartUrl(shoppingList);

      // Check if URL can be opened
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen) {
        Alert.alert(
          'Cannot Open Instacart',
          'Please make sure you have the Instacart app installed or try opening in your browser.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Open URL
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error('Error opening Instacart:', error);
      Alert.alert(
        'Error',
        'Failed to open Instacart. Please try again.',
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
