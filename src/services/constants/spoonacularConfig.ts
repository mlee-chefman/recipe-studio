// Spoonacular API configuration for ingredient autocomplete and recipe suggestions
export const SPOONACULAR_CONFIG = {
  // API endpoints
  BASE_URL: 'https://api.spoonacular.com',
  INGREDIENT_AUTOCOMPLETE_ENDPOINT: '/food/ingredients/autocomplete',
  RECIPE_BY_INGREDIENTS_ENDPOINT: '/recipes/findByIngredients',

  // Request settings
  AUTOCOMPLETE_NUMBER: 10, // Number of autocomplete results to return
  RECIPE_NUMBER: 10, // Number of recipe suggestions to return

  // Rate limiting (Free tier: 150 requests/day)
  DAILY_REQUEST_LIMIT: 150,
  CACHE_DURATION_MS: 3600000, // Cache results for 1 hour
} as const;
