// Ingredient and Fridge-related type definitions

/**
 * Ingredient from Spoonacular autocomplete
 */
export interface SpoonacularIngredient {
  id: number;
  name: string;
  image: string;
}

/**
 * User's selected ingredient in their fridge
 */
export interface FridgeIngredient {
  id: string; // Spoonacular ID as string
  name: string;
  image?: string;
  addedAt: Date;
}

/**
 * Dietary preference options
 */
export type DietaryPreference =
  | 'None'
  | 'Vegetarian'
  | 'Vegan'
  | 'Gluten Free'
  | 'Ketogenic'
  | 'Paleo'
  | 'Pescatarian'
  | 'Whole30'
  | 'Kosher';

/**
 * Cuisine preference options
 */
export type CuisinePreference =
  | 'Any'
  | 'African'
  | 'Asian'
  | 'American'
  | 'British'
  | 'Cajun'
  | 'Caribbean'
  | 'Chinese'
  | 'Eastern European'
  | 'European'
  | 'French'
  | 'German'
  | 'Greek'
  | 'Indian'
  | 'Irish'
  | 'Italian'
  | 'Japanese'
  | 'Jewish'
  | 'Korean'
  | 'Latin American'
  | 'Mediterranean'
  | 'Mexican'
  | 'Middle Eastern'
  | 'Nordic'
  | 'Southern'
  | 'Spanish'
  | 'Thai'
  | 'Vietnamese';

/**
 * Cooking time preference options
 */
export type CookingTimePreference =
  | 'Any'
  | 'Under 15 minutes'
  | '15-30 minutes'
  | '30-60 minutes'
  | 'Over 1 hour';

/**
 * Recipe category preference
 */
export type CategoryPreference =
  | 'Any'
  | 'Main Dish'
  | 'Appetizer'
  | 'Side Dish'
  | 'Dessert'
  | 'Soup'
  | 'Salad'
  | 'Breakfast'
  | 'Snack';

/**
 * Recipe matching strictness
 */
export type MatchingStrictness =
  | 'exact' // Only recipes using these exact ingredients
  | 'substitutions' // Allow substitutions for missing ingredients
  | 'creative'; // Let AI be creative with similar ingredients

/**
 * Recipe source type (AI-generated vs existing)
 */
export type RecipeSource = 'ai' | 'existing';

/**
 * User preferences for recipe generation from fridge ingredients
 */
export interface FridgePreferences {
  dietary: DietaryPreference;
  cuisine: CuisinePreference;
  cookingTime: CookingTimePreference;
  category: CategoryPreference;
  matchingStrictness: MatchingStrictness;
  recipeSource: RecipeSource; // Toggle between AI and existing recipes
}

/**
 * Substitution suggestion for missing ingredients
 */
export interface IngredientSubstitution {
  missing: string; // Missing ingredient name
  substitutes: string[]; // Suggested substitutes
}

/**
 * AI-generated recipe result with metadata
 */
export interface GeneratedRecipeResult {
  recipe: any; // Recipe object (will use Recipe type from recipe.ts)
  matchPercentage: number; // How well it matches user's ingredients
  missingIngredients: string[]; // Ingredients user doesn't have
  substitutions: IngredientSubstitution[]; // Suggested substitutions
  source: 'gemini' | 'spoonacular'; // Which AI generated this
}
