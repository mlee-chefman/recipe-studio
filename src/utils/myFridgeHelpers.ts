import { MatchingStrictness } from '~/types/ingredient';

/**
 * Get display label for matching strictness
 */
export const getStrictnessLabel = (value: MatchingStrictness): string => {
  switch (value) {
    case 'exact':
      return 'Exact Match';
    case 'substitutions':
      return 'Allow Substitutions';
    case 'creative':
      return 'Creative Suggestions';
  }
};

/**
 * Get description for matching strictness
 */
export const getStrictnessDescription = (value: MatchingStrictness): string => {
  switch (value) {
    case 'exact':
      return 'Only recipes using these exact ingredients';
    case 'substitutions':
      return 'Suggest alternatives for missing ingredients';
    case 'creative':
      return 'Let AI be creative with similar ingredients';
  }
};

/**
 * Get ingredient image URL from Spoonacular CDN
 */
export const getIngredientImageUrl = (imageName: string): string => {
  return `https://spoonacular.com/cdn/ingredients_100x100/${imageName}`;
};
