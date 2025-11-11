import Constants from 'expo-constants';
import { SPOONACULAR_CONFIG } from './constants/spoonacularConfig';
import { SpoonacularIngredient } from '~/types/ingredient';

/**
 * Service for ingredient-related API calls using Spoonacular API
 */

// Get API key from environment
const SPOONACULAR_API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SPOONACULAR_API_KEY ||
  process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;

// Simple in-memory cache for autocomplete results
const autocompleteCache = new Map<string, { data: SpoonacularIngredient[]; timestamp: number }>();

/**
 * Get ingredient autocomplete suggestions
 * @param query - Search query (e.g., "ros" for rosemary)
 * @param number - Number of results to return (default: 10)
 * @returns Array of ingredient suggestions
 */
export async function getIngredientAutocomplete(
  query: string,
  number: number = SPOONACULAR_CONFIG.AUTOCOMPLETE_NUMBER,
): Promise<{ success: boolean; data?: SpoonacularIngredient[]; error?: string }> {
  try {
    // Validate inputs
    if (!query || query.trim().length === 0) {
      return { success: false, error: 'Query cannot be empty' };
    }

    if (!SPOONACULAR_API_KEY) {
      console.warn('Spoonacular API key not found. Please add it to your .env file.');
      return { success: false, error: 'API key not configured' };
    }

    const normalizedQuery = query.trim().toLowerCase();

    // Check cache first
    const cacheKey = `${normalizedQuery}_${number}`;
    const cached = autocompleteCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SPOONACULAR_CONFIG.CACHE_DURATION_MS) {
      console.log('Returning cached ingredient autocomplete results');
      return { success: true, data: cached.data };
    }

    // Build API URL
    const url = new URL(
      SPOONACULAR_CONFIG.INGREDIENT_AUTOCOMPLETE_ENDPOINT,
      SPOONACULAR_CONFIG.BASE_URL,
    );
    url.searchParams.append('query', normalizedQuery);
    url.searchParams.append('number', number.toString());
    url.searchParams.append('apiKey', SPOONACULAR_API_KEY);
    url.searchParams.append('metaInformation', 'true');

    console.log('Fetching ingredient autocomplete from Spoonacular API...');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle rate limiting
    if (response.status === 402) {
      return {
        success: false,
        error: 'Daily API request limit exceeded. Please try again tomorrow.',
      };
    }

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key' };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed with status ${response.status}`,
      };
    }

    const data: SpoonacularIngredient[] = await response.json();

    // Cache the results
    autocompleteCache.set(cacheKey, { data, timestamp: Date.now() });

    console.log(`Found ${data.length} ingredient suggestions`);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching ingredient autocomplete:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Clear the autocomplete cache (useful for testing or memory management)
 */
export function clearAutocompleteCache(): void {
  autocompleteCache.clear();
  console.log('Ingredient autocomplete cache cleared');
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: autocompleteCache.size,
    keys: Array.from(autocompleteCache.keys()),
  };
}

/**
 * Get ingredient image URL from Spoonacular
 * Image URLs are FREE - they're returned from the autocomplete API
 * @param ingredientName - Name of the ingredient (e.g., "flour")
 * @returns Image URL or undefined if not found
 */
export async function getIngredientImage(
  ingredientName: string
): Promise<string | undefined> {
  try {
    // Search for ingredient via autocomplete (returns with image URLs)
    const result = await getIngredientAutocomplete(ingredientName, 1);

    if (!result.success || !result.data || result.data.length === 0) {
      return undefined;
    }

    const ingredient = result.data[0];

    // Construct full image URL
    // Spoonacular image format: https://spoonacular.com/cdn/ingredients_100x100/[image]
    if (ingredient.image) {
      return `https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}`;
    }

    return undefined;
  } catch (error) {
    console.error('Error fetching ingredient image:', error);
    return undefined;
  }
}

/**
 * Get images for multiple ingredients at once
 * Uses batching to reduce API calls
 * @param ingredientNames - Array of ingredient names
 * @returns Map of ingredient name to image URL
 */
export async function getIngredientImages(
  ingredientNames: string[]
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();

  // Process in batches to avoid rate limiting
  const batchSize = 5;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < ingredientNames.length; i += batchSize) {
    const batch = ingredientNames.slice(i, i + batchSize);

    // Fetch all images in parallel within batch
    const promises = batch.map(async (name) => {
      const image = await getIngredientImage(name);
      if (image) {
        imageMap.set(name, image);
      }
    });

    await Promise.all(promises);

    // Add delay between batches to respect rate limits
    if (i + batchSize < ingredientNames.length) {
      await delay(1000); // 1 second delay between batches
    }
  }

  return imageMap;
}
