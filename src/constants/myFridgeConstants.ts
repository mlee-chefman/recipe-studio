import {
  DietaryPreference,
  CuisinePreference,
  CookingTimePreference,
  CategoryPreference,
  MatchingStrictness,
} from '~/types/ingredient';

// Maximum number of ingredients allowed
export const MAX_INGREDIENTS = 12;

// Number of recipes to generate at a time
export const RECIPES_PER_GENERATION = 2;

// Preference options
export const DIETARY_OPTIONS: readonly DietaryPreference[] = [
  'None',
  'Vegetarian',
  'Vegan',
  'Gluten Free',
  'Ketogenic',
  'Paleo',
  'Pescatarian',
  'Whole30',
  'Kosher',
] as const;

export const CUISINE_OPTIONS: readonly CuisinePreference[] = [
  'Any',
  'African',
  'American',
  'Asian',
  'British',
  'Cajun',
  'Caribbean',
  'Chinese',
  'Eastern European',
  'European',
  'French',
  'German',
  'Greek',
  'Indian',
  'Irish',
  'Italian',
  'Japanese',
  'Jewish',
  'Korean',
  'Latin American',
  'Mediterranean',
  'Mexican',
  'Middle Eastern',
  'Nordic',
  'Southern',
  'Spanish',
  'Thai',
  'Vietnamese',
] as const;

export const COOKING_TIME_OPTIONS: readonly CookingTimePreference[] = [
  'Any',
  'Under 15 minutes',
  '15-30 minutes',
  '30-60 minutes',
  'Over 1 hour',
] as const;

export const CATEGORY_OPTIONS: readonly CategoryPreference[] = [
  'Any',
  'Main Dish',
  'Appetizer',
  'Side Dish',
  'Dessert',
  'Soup',
  'Salad',
  'Breakfast',
  'Snack',
] as const;

export const MATCHING_STRICTNESS_OPTIONS: readonly MatchingStrictness[] = [
  'exact',
  'substitutions',
  'creative',
] as const;

// Spoonacular CDN URL for ingredient images
export const SPOONACULAR_IMAGE_BASE_URL = 'https://spoonacular.com/cdn/ingredients_100x100/';
