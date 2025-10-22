import { Recipe } from '~/types/recipe';

/**
 * Recipe with match information
 */
export interface MatchedRecipe {
  recipe: Recipe;
  matchPercentage: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

/**
 * Extracts ingredient names from ingredient strings (e.g., "2 cups flour" -> "flour")
 */
function extractIngredientName(ingredientString: string): string {
  // Remove common measurements and numbers
  const cleaned = ingredientString
    .toLowerCase()
    .replace(/\d+/g, '') // Remove numbers
    .replace(/cup|cups|tablespoon|tablespoons|tbsp|teaspoon|teaspoons|tsp|pound|pounds|lb|lbs|ounce|ounces|oz|gram|grams|g|kg|ml|l|pinch|dash/gi, '')
    .replace(/\(/g, '') // Remove parentheses
    .replace(/\)/g, '')
    .trim();

  // Get the main ingredient (first significant word after measurements)
  const words = cleaned.split(/\s+/);
  return words.filter(word => word.length > 2)[0] || cleaned;
}

/**
 * Check if two ingredient names match (with fuzzy matching)
 */
function ingredientsMatch(userIngredient: string, recipeIngredient: string): boolean {
  const user = userIngredient.toLowerCase().trim();
  const recipe = recipeIngredient.toLowerCase().trim();

  // Exact match
  if (user === recipe) return true;

  // One contains the other
  if (user.includes(recipe) || recipe.includes(user)) return true;

  // Check for common variations
  const variations: Record<string, string[]> = {
    'chicken': ['chicken breast', 'chicken thigh', 'chicken leg', 'poultry'],
    'tomato': ['tomatoes', 'cherry tomatoes', 'roma tomatoes'],
    'onion': ['onions', 'yellow onion', 'red onion', 'white onion'],
    'garlic': ['garlic cloves', 'garlic powder'],
    'pepper': ['black pepper', 'white pepper', 'bell pepper'],
    'oil': ['olive oil', 'vegetable oil', 'canola oil', 'cooking oil'],
    'butter': ['unsalted butter', 'salted butter'],
  };

  for (const [base, variants] of Object.entries(variations)) {
    if ((user.includes(base) && variants.some(v => recipe.includes(v))) ||
        (recipe.includes(base) && variants.some(v => user.includes(v)))) {
      return true;
    }
  }

  return false;
}

/**
 * Match existing recipes from user's collection based on available ingredients
 * @param userIngredients - Array of ingredient names user has
 * @param recipes - Array of recipes to search through
 * @param minMatchPercentage - Minimum match percentage to include (default: 50)
 * @returns Array of matched recipes sorted by match percentage (highest first)
 */
export function matchExistingRecipes(
  userIngredients: string[],
  recipes: Recipe[],
  minMatchPercentage: number = 50
): MatchedRecipe[] {
  const matchedRecipes: MatchedRecipe[] = [];

  for (const recipe of recipes) {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      continue;
    }

    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];

    // Extract ingredient names from recipe
    const recipeIngredientNames = recipe.ingredients.map(extractIngredientName);

    // Check each recipe ingredient against user's ingredients
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const recipeIngredient = recipe.ingredients[i];
      const recipeIngredientName = recipeIngredientNames[i];

      let found = false;
      for (const userIngredient of userIngredients) {
        if (ingredientsMatch(userIngredient, recipeIngredientName)) {
          matchedIngredients.push(recipeIngredient);
          found = true;
          break;
        }
      }

      if (!found) {
        missingIngredients.push(recipeIngredient);
      }
    }

    // Calculate match percentage
    const matchPercentage = Math.round(
      (matchedIngredients.length / recipe.ingredients.length) * 100
    );

    // Only include recipes that meet the minimum match percentage
    if (matchPercentage >= minMatchPercentage) {
      matchedRecipes.push({
        recipe,
        matchPercentage,
        matchedIngredients,
        missingIngredients,
      });
    }
  }

  // Sort by match percentage (highest first)
  return matchedRecipes.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

/**
 * Get the top N matched recipes
 * @param userIngredients - Array of ingredient names user has
 * @param recipes - Array of recipes to search through
 * @param limit - Maximum number of recipes to return (default: 5)
 * @param minMatchPercentage - Minimum match percentage to include (default: 50)
 * @returns Array of top matched recipes
 */
export function getTopMatchedRecipes(
  userIngredients: string[],
  recipes: Recipe[],
  limit: number = 5,
  minMatchPercentage: number = 50
): MatchedRecipe[] {
  const matched = matchExistingRecipes(userIngredients, recipes, minMatchPercentage);
  return matched.slice(0, limit);
}
