import { ScrapedRecipe } from '@utils/recipeScraper';

/**
 * Normalize recipe title for comparison
 * Removes special characters, converts to lowercase, normalizes whitespace
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove duplicate recipes based on normalized titles
 * Keeps first occurrence of each unique recipe
 * @param recipes - Array of recipes to deduplicate
 * @returns Array of unique recipes
 */
export function deduplicateRecipes(recipes: ScrapedRecipe[]): ScrapedRecipe[] {
  const uniqueRecipes: ScrapedRecipe[] = [];
  const seenTitles = new Set<string>();

  for (const recipe of recipes) {
    const normalizedTitle = normalizeTitle(recipe.title);

    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniqueRecipes.push(recipe);
    } else {
      console.log(`Skipping duplicate recipe: ${recipe.title}`);
    }
  }

  return uniqueRecipes;
}

/**
 * Log deduplication results
 */
export function logDeduplicationResults(originalCount: number, uniqueCount: number): void {
  console.log(`Total recipes before deduplication: ${originalCount}`);
  console.log(`Total unique recipes: ${uniqueCount}`);

  if (originalCount > uniqueCount) {
    console.log(`Removed ${originalCount - uniqueCount} duplicate recipes`);
  }
}
