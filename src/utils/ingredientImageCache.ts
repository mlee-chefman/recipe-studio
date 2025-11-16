// Ingredient image caching utility with AsyncStorage persistence
// Reduces Spoonacular API calls by caching images across app sessions

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIngredientImage } from '../services/ingredient.service';
import { instacartService } from '../services/instacart.service';
import { simplifyIngredientName, simplifyIngredientNamesBatch } from '../services/ingredientSimplifier.service';

const CACHE_KEY_PREFIX = '@ingredient_image_';
const CACHE_DURATION_DAYS = 30; // Cache ingredient images for 30 days
const CACHE_DURATION_MS = CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000;

interface CachedImage {
  url: string;
  timestamp: number;
}

/**
 * Clean ingredient name for better image matching
 * Removes common descriptors that might prevent matches
 */
function cleanIngredientName(name: string): string {
  let cleaned = name.toLowerCase().trim();

  // Remove everything after comma (preparation instructions)
  // "garlic, minced" → "garlic"
  // "salmon fillets, skin on" → "salmon fillets"
  if (cleaned.includes(',')) {
    cleaned = cleaned.split(',')[0].trim();
  }

  // Remove parenthetical notes like "(divided)" or "(6-ounce)" or "(e.g., ribeye, sirloin)"
  cleaned = cleaned.replace(/\([^)]*\)/g, '').trim();

  // Remove "e.g." examples that might not be in parentheses
  cleaned = cleaned.replace(/\s*e\.g\.,?.*$/gi, '').trim();

  // Remove "to taste" phrases
  // "salt to taste" → "salt"
  cleaned = cleaned.replace(/\s+to\s+taste$/gi, '').trim();

  // Remove "or [alternative]" phrases
  // "water or vegetable broth" → "water"
  if (cleaned.includes(' or ')) {
    cleaned = cleaned.split(' or ')[0].trim();
  }

  // Remove measurement units (both at start and anywhere in the string)
  // "inch ginger" → "ginger"
  // "salmon fillets" → "salmon"
  const measurementUnits = [
    'inch', 'inches', 'cm', 'centimeter', 'centimeters',
    'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves',
    'sprig', 'sprigs', 'stalk', 'stalks', 'bunch', 'bunches',
    'pinch', 'pinches', 'dash', 'dashes',
    'fillet', 'fillets', 'breast', 'breasts', 'thigh', 'thighs',
  ];

  measurementUnits.forEach(unit => {
    // Remove at start
    const startRegex = new RegExp(`^${unit}\\s+`, 'gi');
    cleaned = cleaned.replace(startRegex, '').trim();

    // Also remove as a standalone word anywhere
    const anywhereRegex = new RegExp(`\\b${unit}\\b`, 'gi');
    cleaned = cleaned.replace(anywhereRegex, '').trim();
  });

  // Remove common descriptors
  const descriptors = [
    'fresh', 'dried', 'frozen', 'canned', 'organic',
    'raw', 'cooked', 'chopped', 'diced', 'sliced', 'minced',
    'ground', 'whole', 'shredded', 'grated', 'peeled',
    'room temperature', 'cold', 'warm', 'hot',
    'large', 'medium', 'small',
    'all-purpose', 'self-rising', 'unbleached',
    'extra virgin', 'virgin', 'light', 'heavy',
    'unsalted', 'salted', 'sweetened', 'unsweetened',
    'low-fat', 'non-fat', 'fat-free', 'reduced-fat',
    'thinly', 'thickly', 'finely', 'roughly', 'coarsely',
    'purple', 'white', 'brown', 'red', 'green', 'yellow', // color descriptors
    'black', 'skin on', 'boneless', 'skinless',
    'dipping', 'for dipping', 'for serving', // serving descriptors
  ];

  descriptors.forEach(descriptor => {
    const regex = new RegExp(`\\b${descriptor}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '').trim();
  });

  // Special mappings for common ingredients with specific names
  const specialMappings: { [key: string]: string } = {
    'vegetable broth': 'broth',
    'chicken broth': 'broth',
    'beef broth': 'broth',
    'sauces': 'sauce', // "dipping sauces" → "sauce"
  };

  Object.entries(specialMappings).forEach(([from, to]) => {
    if (cleaned === from) {
      cleaned = to;
    }
  });

  // Handle plural forms - if no image found for plural, will retry with singular
  // This is handled by the fallback logic below

  // Remove extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Get ingredient image from cache or fetch from API
 * Uses AsyncStorage for persistent caching
 */
export async function getIngredientImageCached(ingredientText: string): Promise<string | null> {
  try {
    // Step 1: Ask Gemini to simplify the ingredient name
    console.log(`🔍 Simplifying ingredient: "${ingredientText}"`);
    const simplifiedName = await simplifyIngredientName(ingredientText);

    if (!simplifiedName) {
      console.log(`❌ No simplified name for: "${ingredientText}"`);
      return null;
    }

    console.log(`✨ Simplified: "${ingredientText}" → "${simplifiedName}"`);

    // Check AsyncStorage cache first (use simplified name for cache key)
    const cacheKey = `${CACHE_KEY_PREFIX}${simplifiedName}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);

    if (cachedData) {
      const cached: CachedImage = JSON.parse(cachedData);
      const age = Date.now() - cached.timestamp;

      // Return cached image if not expired
      if (age < CACHE_DURATION_MS) {
        console.log(`✅ Using cached image for: "${simplifiedName}"`);
        return cached.url;
      } else {
        // Cache expired, remove it
        await AsyncStorage.removeItem(cacheKey);
        console.log(`🔄 Cache expired for: "${simplifiedName}"`);
      }
    }

    // Fetch from API using simplified name from Gemini
    console.log(`📡 Fetching from Spoonacular: "${simplifiedName}"`);
    let imageUrl = await getIngredientImage(simplifiedName);

    // Gemini usually gives us a single word, but just in case try fallback
    if (!imageUrl && simplifiedName.includes(' ')) {
      const words = simplifiedName.split(' ');
      const mainNoun = words[words.length - 1]; // Get last word
      console.log(`🔄 Retrying with main noun: "${mainNoun}"`);
      imageUrl = await getIngredientImage(mainNoun);

      if (imageUrl) {
        // Cache using the main noun
        const retryKey = `${CACHE_KEY_PREFIX}${mainNoun}`;
        const cacheData: CachedImage = {
          url: imageUrl,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(retryKey, JSON.stringify(cacheData));
        console.log(`✅ Found and cached image for: "${mainNoun}"`);
        return imageUrl;
      }
    }

    if (imageUrl) {
      // Cache in AsyncStorage
      const cacheData: CachedImage = {
        url: imageUrl,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`✅ Found and cached image for: "${simplifiedName}"`);
      return imageUrl;
    }

    console.log(`❌ No image found for: "${simplifiedName}" (original: "${ingredientText}")`);
    return null;
  } catch (error) {
    console.error(`❌ Error getting ingredient image for "${ingredientText}":`, error);
    return null;
  }
}

/**
 * Get images for multiple ingredients - FULLY OPTIMIZED!
 * - Single Gemini API call to simplify ALL ingredients at once
 * - Parallel Spoonacular fetches for ALL images at once
 * - No artificial delays needed!
 *
 * @param ingredients - Array of ingredient strings
 * @param onProgress - Optional callback with loaded images (called once at end)
 */
export async function getIngredientImagesProgressive(
  ingredients: string[],
  onProgress?: (images: Map<string, string>) => void
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();

  if (ingredients.length === 0) {
    return imageMap;
  }

  // Step 1: Simplify ALL ingredients in a SINGLE Gemini API call
  console.log(`🚀 Batch simplifying ${ingredients.length} ingredients...`);
  const simplifiedMap = await simplifyIngredientNamesBatch(ingredients);

  // Step 2: Fetch images with smart batching (10 at a time to be safe)
  const SPOONACULAR_BATCH_SIZE = 10; // Conservative limit to avoid rate limiting
  console.log(`📡 Fetching ${ingredients.length} images (${SPOONACULAR_BATCH_SIZE} at a time)...`);

  for (let i = 0; i < ingredients.length; i += SPOONACULAR_BATCH_SIZE) {
    const batch = ingredients.slice(i, i + SPOONACULAR_BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (originalIngredient) => {
        const simplifiedName = simplifiedMap.get(originalIngredient) || originalIngredient;

        // Check image cache
        const cacheKey = `${CACHE_KEY_PREFIX}${simplifiedName}`;
        const cachedImage = await AsyncStorage.getItem(cacheKey);

        if (cachedImage) {
          const cached: CachedImage = JSON.parse(cachedImage);
          const age = Date.now() - cached.timestamp;

          if (age < CACHE_DURATION_MS) {
            console.log(`✅ Cache hit for: ${simplifiedName}`);
            return { ingredient: originalIngredient, imageUrl: cached.url };
          }
        }

        // Fetch from Spoonacular
        console.log(`📡 Fetching image for: ${simplifiedName}`);
        const imageUrl = await getIngredientImage(simplifiedName);

        if (imageUrl) {
          // Cache the image
          const cacheData: CachedImage = {
            url: imageUrl,
            timestamp: Date.now(),
          };
          await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
          console.log(`✅ Found and cached: ${simplifiedName}`);
        } else {
          console.log(`❌ No image for: ${simplifiedName}`);
        }

        return { ingredient: originalIngredient, imageUrl: imageUrl || null };
      })
    );

    // Add batch results to map
    batchResults.forEach(({ ingredient, imageUrl }) => {
      if (imageUrl) {
        imageMap.set(ingredient, imageUrl);
      }
    });

    // Call progress callback after each batch
    if (onProgress) {
      onProgress(new Map(imageMap));
    }

    // Small delay between batches (but not after the last batch)
    if (i + SPOONACULAR_BATCH_SIZE < ingredients.length) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5s between batches
    }
  }

  console.log(`✅ Image loading complete: ${imageMap.size}/${ingredients.length} images found in ~${Math.round(performance.now() / 1000)}s`);
  return imageMap;
}

/**
 * Clear all cached ingredient images
 * Useful for testing or freeing up storage
 */
export async function clearIngredientImageCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const imageCacheKeys = allKeys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

    if (imageCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(imageCacheKeys);
      console.log(`Cleared ${imageCacheKeys.length} cached ingredient images`);
    }
  } catch (error) {
    console.error('Error clearing ingredient image cache:', error);
  }
}

/**
 * Get cache statistics
 * Returns number of cached images and total size
 */
export async function getIngredientImageCacheStats(): Promise<{
  count: number;
  ingredients: string[];
}> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const imageCacheKeys = allKeys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

    const ingredients = imageCacheKeys.map(key =>
      key.replace(CACHE_KEY_PREFIX, '')
    );

    return {
      count: imageCacheKeys.length,
      ingredients,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { count: 0, ingredients: [] };
  }
}

/**
 * Preload ingredient images for a recipe
 * Useful for warming up the cache
 */
export async function preloadRecipeIngredientImages(
  ingredients: string[]
): Promise<void> {
  console.log(`Preloading images for ${ingredients.length} ingredients...`);

  // Load silently in background with longer delays
  await getIngredientImagesProgressive(
    ingredients,
    undefined, // No progress callback
    2, // Smaller batches
    3000 // Longer delays (3 seconds)
  );

  console.log('Preloading complete');
}
