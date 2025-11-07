// Shopping cart and Instacart integration type definitions

/**
 * Valid Instacart ingredient units
 * Based on Instacart API specification
 */
export const INSTACART_INGREDIENT_UNITS = [
  // Volume measurements
  'c', 'cup', 'cups',
  'fl oz', 'fluid ounce', 'fluid ounces',
  'gallon', 'gallons',
  'ml', 'milliliter', 'milliliters',
  'liter', 'liters', 'l',
  'pint', 'pints', 'pt',
  'quart', 'quarts', 'qt',
  'tablespoon', 'tablespoons', 'tbsp', 'tbs', 'T',
  'teaspoon', 'teaspoons', 'tsp', 't',

  // Weight measurements
  'g', 'gram', 'grams',
  'kg', 'kilogram', 'kilograms',
  'lb', 'lbs', 'pound', 'pounds',
  'oz', 'ounce', 'ounces',
  'mg', 'milligram', 'milligrams',

  // Countable items
  'bunch', 'bunches',
  'can', 'cans',
  'clove', 'cloves',
  'each',
  'head', 'heads',
  'jar', 'jars',
  'package', 'packages', 'pkg',
  'piece', 'pieces',
  'slice', 'slices',
  'stalk', 'stalks',
  'stick', 'sticks',

  // Size descriptors
  'large',
  'medium',
  'small',
  'whole',

  // Other
  'dash', 'dashes',
  'handful',
  'pinch', 'pinches',
  'sprig', 'sprigs',
  'to taste',
] as const;

export type InstacartIngredientUnit = typeof INSTACART_INGREDIENT_UNITS[number];

/**
 * Parsed ingredient with quantity, unit, and name
 * Used for shopping cart functionality
 */
export interface ParsedIngredient {
  original: string; // Original ingredient text (e.g., "2 1/2 cups flour")
  quantity?: number; // Numeric quantity (e.g., 2.5)
  unit?: string; // Unit of measurement (e.g., "cups")
  name: string; // Ingredient name (e.g., "flour")
  notes?: string; // Additional notes (e.g., "sifted", "room temperature")
}

/**
 * Ingredient with selection state for shopping cart
 * Extends ParsedIngredient with selection flag
 */
export interface SelectableIngredient extends ParsedIngredient {
  id: string; // Unique identifier
  selected: boolean; // Whether user selected this ingredient
  spoonacularId?: number; // Spoonacular ingredient ID for images
  image?: string; // Ingredient image URL from Spoonacular
}

/**
 * Shopping line item for Instacart
 * Maps to Instacart API format
 */
export interface ShoppingLineItem {
  name: string; // Ingredient name
  quantity?: number; // Numeric quantity
  unit?: InstacartIngredientUnit; // Unit (must be valid Instacart unit)
  display_text?: string; // Full display text (e.g., "2 1/2 cups all-purpose flour")
}

/**
 * Shopping list for a recipe or multiple recipes
 * Used to generate Instacart cart link
 */
export interface ShoppingList {
  recipeIds: string[]; // Recipe IDs in this shopping list
  recipeTitles: string[]; // Recipe titles for display
  items: ShoppingLineItem[]; // Shopping line items
  totalItems: number; // Total number of items
}

/**
 * Instacart cart link parameters
 */
export interface InstacartCartParams {
  items: ShoppingLineItem[]; // Items to add to cart
  title?: string; // Shopping list title
  affId: string; // Affiliate ID (for 5% commission)
  offerId: string; // Offer ID
  utmSource: string; // UTM tracking source
  utmMedium: string; // UTM tracking medium
}

/**
 * Recipe with selectable ingredients
 * Used in Recipe Detail screen
 */
export interface RecipeWithSelectableIngredients {
  recipeId: string;
  recipeTitle: string;
  servings: number; // Current serving size
  originalServings: number; // Original serving size
  ingredients: SelectableIngredient[];
}

/**
 * Missing ingredients for My Fridge feature
 * Shows which ingredients user needs to buy
 */
export interface MissingIngredientsInfo {
  recipeId: string;
  recipeTitle: string;
  missingIngredients: SelectableIngredient[];
  totalMissing: number;
  matchPercentage: number; // Percentage of ingredients user has
}

/**
 * Ingredient combination result
 * Used when combining ingredients from multiple recipes
 */
export interface CombinedIngredient extends ParsedIngredient {
  recipeIds: string[]; // Which recipes need this ingredient
  quantities: number[]; // Individual quantities from each recipe
  totalQuantity: number; // Combined total quantity
}

/**
 * Shopping cart state
 * Manages all shopping-related data
 */
export interface ShoppingCartState {
  recipes: RecipeWithSelectableIngredients[];
  combinedIngredients: CombinedIngredient[];
  isLoading: boolean;
  error?: string;
}

/**
 * Helper type for ingredient parsing
 */
export interface IngredientParseResult {
  success: boolean;
  ingredient?: ParsedIngredient;
  error?: string;
}

/**
 * Instacart affiliate configuration
 * ChefIQ's Instacart partnership details
 */
export const INSTACART_CONFIG = {
  affId: '1538', // ChefIQ affiliate ID
  offerId: '1', // Standard offer
  utmSource: 'chefiq_recipe_studio',
  utmMedium: 'affiliate_recipe_mobile',
  cartBaseUrl: 'https://www.instacart.com/store/partner_recipe',
} as const;
