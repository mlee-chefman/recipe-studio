import { Recipe } from '~/types/recipe';
import { getApplianceById } from '~/types/chefiq';

/**
 * Counts the number of active filters
 */
export const getActiveFiltersCount = (
  selectedCategory: string,
  selectedDifficulty: string,
  selectedTags: string[],
  selectedAppliance: string
): number => {
  let count = 0;
  if (selectedCategory) count++;
  if (selectedDifficulty) count++;
  if (selectedTags.length > 0) count += selectedTags.length;
  if (selectedAppliance) count++;
  return count;
};

/**
 * Extracts unique categories from recipes
 */
export const getUniqueCategories = (recipes: Recipe[]): string[] => {
  return Array.from(new Set(recipes.map(recipe => recipe.category).filter(c => c)));
};

/**
 * Extracts unique tags from all recipes
 */
export const getUniqueTags = (recipes: Recipe[]): string[] => {
  return Array.from(new Set(recipes.flatMap(recipe => recipe.tags || [])));
};

/**
 * Extracts unique appliances from recipes, deduplicated by ID
 */
export const getUniqueAppliances = (recipes: Recipe[]): { id: string; name: string }[] => {
  const applianceMap = new Map<string, { id: string; name: string }>();

  recipes
    .filter(recipe => recipe.chefiqAppliance)
    .forEach(recipe => {
      const id = recipe.chefiqAppliance!;
      if (!applianceMap.has(id)) {
        applianceMap.set(id, {
          id,
          name: getApplianceById(id)?.name || 'Unknown'
        });
      }
    });

  return Array.from(applianceMap.values());
};

/**
 * Standard difficulty options
 */
export const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
