// Ingredient name simplification service using Gemini AI
// Simplifies complex ingredient descriptions to searchable names for image lookup

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GEMINI_API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY ||
  process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const CACHE_KEY_PREFIX = '@ingredient_simplified_';
const CACHE_DURATION_DAYS = 90; // Cache for 90 days (ingredient names don't change)
const CACHE_DURATION_MS = CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000;

interface CachedSimplification {
  originalName: string;
  simplifiedName: string;
  timestamp: number;
}

/**
 * Simplify ingredient name using Gemini AI
 * Converts complex ingredient descriptions to simple, searchable names
 * Intelligently preserves compound ingredients (oils, sauces, etc.)
 *
 * Examples:
 * - "2 tablespoons olive oil" → "olive oil"
 * - "1/2 cup chicken broth" → "broth"
 * - "3 tablespoons soy sauce" → "soy sauce"
 * - "2 (6-ounce) salmon fillets, skin on" → "salmon"
 * - "1 pound thinly sliced beef (e.g., ribeye, sirloin)" → "beef"
 */
export async function simplifyIngredientName(ingredientText: string): Promise<string> {
  try {
    // Check cache first
    const cacheKey = `${CACHE_KEY_PREFIX}${ingredientText.toLowerCase().trim()}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);

    if (cachedData) {
      const cached: CachedSimplification = JSON.parse(cachedData);
      const age = Date.now() - cached.timestamp;

      if (age < CACHE_DURATION_MS) {
        console.log(`✅ Using cached simplification: "${ingredientText}" → "${cached.simplifiedName}"`);
        return cached.simplifiedName;
      } else {
        // Cache expired
        await AsyncStorage.removeItem(cacheKey);
      }
    }

    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not found. Skipping ingredient simplification.');
      return ingredientText;
    }

    // Call Gemini API to simplify
    console.log(`🤖 Asking Gemini to simplify: "${ingredientText}"`);

    const prompt = `Extract the main ingredient name from this ingredient description for image search. Return 1-2 words maximum that best represent the ingredient (singular form). For compound ingredients like oils, broths, or sauces, keep both words if needed for accurate image search.

Rules:
- Keep compound words when necessary: "olive oil" NOT "olive", "soy sauce" NOT "soy"
- For broths/stocks: simplify to "broth" or "stock" (e.g., "chicken broth" → "broth")
- For produce: use single word (e.g., "cherry tomatoes" → "tomato")
- For meats: use single word (e.g., "chicken breast" → "chicken")
- Remove quantities, measurements, and preparations

Examples:
"2 tablespoons olive oil" → olive oil
"1/2 cup chicken broth" → broth
"2 cups vegetable stock" → stock
"3 tablespoons soy sauce" → soy sauce
"1 tablespoon sesame oil" → sesame oil
"2 (6-ounce) salmon fillets, skin on" → salmon
"1 pound thinly sliced beef (e.g., ribeye, sirloin)" → beef
"2 cups purple rice" → rice
"4 cloves garlic, minced" → garlic
"Salt to taste" → salt
"2 tablespoons rice vinegar" → rice vinegar
"1 cup heavy cream" → cream

Now simplify this:
"${ingredientText}" →`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent results
          maxOutputTokens: 15, // Allow 1-2 words for compound ingredients
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return ingredientText;
    }

    const data = await response.json();
    const simplifiedName = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();

    if (!simplifiedName) {
      console.warn('Gemini returned empty response');
      return ingredientText;
    }

    console.log(`✅ Gemini simplified: "${ingredientText}" → "${simplifiedName}"`);

    // Cache the result
    const cacheData: CachedSimplification = {
      originalName: ingredientText,
      simplifiedName,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

    return simplifiedName;
  } catch (error) {
    console.error('Error simplifying ingredient name:', error);
    return ingredientText; // Fallback to original
  }
}

/**
 * Simplify multiple ingredient names in a SINGLE batch API call
 * Much more efficient than calling Gemini for each ingredient individually
 */
export async function simplifyIngredientNamesBatch(
  ingredientTexts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  if (ingredientTexts.length === 0) {
    return results;
  }

  try {
    // Check cache for all ingredients first
    const uncachedIngredients: string[] = [];
    const cachePromises = ingredientTexts.map(async (text) => {
      const cacheKey = `${CACHE_KEY_PREFIX}${text.toLowerCase().trim()}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (cachedData) {
        const cached: CachedSimplification = JSON.parse(cachedData);
        const age = Date.now() - cached.timestamp;

        if (age < CACHE_DURATION_MS) {
          results.set(text, cached.simplifiedName);
          return null; // Cached, no need to fetch
        }
      }

      return text; // Need to fetch
    });

    const needsFetch = (await Promise.all(cachePromises)).filter((t): t is string => t !== null);

    if (needsFetch.length === 0) {
      console.log(`✅ All ${ingredientTexts.length} ingredients found in cache!`);
      if (onProgress) onProgress(ingredientTexts.length, ingredientTexts.length);
      return results;
    }

    console.log(`🤖 Batch simplifying ${needsFetch.length} ingredients in single API call...`);

    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not found. Returning original names.');
      needsFetch.forEach(text => results.set(text, text));
      return results;
    }

    // Create batch prompt - single API call for all ingredients
    const numberedList = needsFetch.map((text, i) => `${i + 1}. "${text}"`).join('\n');

    const prompt = `Extract the main ingredient name from each ingredient description for image search. Return 1-2 words maximum per ingredient (singular form). For compound ingredients like oils, broths, or sauces, keep both words if needed for accurate image search.

Rules:
- Keep compound words when necessary: "olive oil" NOT "olive", "soy sauce" NOT "soy"
- For broths/stocks: simplify to "broth" or "stock" (e.g., "chicken broth" → "broth")
- For produce: use single word (e.g., "cherry tomatoes" → "tomato")
- For meats: use single word (e.g., "chicken breast" → "chicken")
- Remove quantities, measurements, and preparations
- Return results in same order, one per line

Examples format:
1. "2 tablespoons olive oil" → olive oil
2. "1/2 cup chicken broth" → broth
3. "3 tablespoons soy sauce" → soy sauce
4. "2 (6-ounce) salmon fillets, skin on" → salmon
5. "2 cloves garlic, minced" → garlic
6. "1 cup heavy cream" → cream

Now simplify these ingredients (1-2 words per line, same order):
${numberedList}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: needsFetch.length * 8, // ~8 tokens per ingredient (for compound words)
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      needsFetch.forEach(text => results.set(text, text));
      return results;
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!responseText) {
      console.warn('Gemini returned empty response');
      needsFetch.forEach(text => results.set(text, text));
      return results;
    }

    // Parse response - should be one word per line
    const simplifiedNames = responseText.split('\n').map((line: string) =>
      line.trim().toLowerCase().replace(/^\d+\.\s*/, '') // Remove numbering if present
    );

    // Map results back to original ingredients
    needsFetch.forEach((originalText, index) => {
      const simplifiedName = simplifiedNames[index] || originalText;
      results.set(originalText, simplifiedName);

      // Cache each result
      const cacheKey = `${CACHE_KEY_PREFIX}${originalText.toLowerCase().trim()}`;
      const cacheData: CachedSimplification = {
        originalName: originalText,
        simplifiedName,
        timestamp: Date.now(),
      };
      AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

      console.log(`✅ Batch result: "${originalText}" → "${simplifiedName}"`);
    });

    if (onProgress) {
      onProgress(ingredientTexts.length, ingredientTexts.length);
    }

    console.log(`✅ Batch simplification complete: ${needsFetch.length} ingredients in 1 API call`);

    return results;
  } catch (error) {
    console.error('Error in batch simplification:', error);
    // Fallback: return original names
    ingredientTexts.forEach(text => results.set(text, text));
    return results;
  }
}

/**
 * Clear simplification cache
 */
export async function clearSimplificationCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Cleared ${cacheKeys.length} cached ingredient simplifications`);
    }
  } catch (error) {
    console.error('Error clearing simplification cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getSimplificationCacheStats(): Promise<{
  count: number;
  entries: Array<{ original: string; simplified: string }>;
}> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

    const entries = await Promise.all(
      cacheKeys.map(async (key) => {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const cached: CachedSimplification = JSON.parse(data);
          return {
            original: cached.originalName,
            simplified: cached.simplifiedName,
          };
        }
        return null;
      })
    );

    return {
      count: cacheKeys.length,
      entries: entries.filter((e): e is { original: string; simplified: string } => e !== null),
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { count: 0, entries: [] };
  }
}
