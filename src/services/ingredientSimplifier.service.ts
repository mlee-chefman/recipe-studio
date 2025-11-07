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
 *
 * Examples:
 * - "2 (6-ounce) salmon fillets, skin on" → "salmon"
 * - "1 pound thinly sliced beef (e.g., ribeye, sirloin)" → "beef"
 * - "Dipping sauces (e.g., sesame paste, chili oil, soy sauce)" → "sauce"
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

    const prompt = `Extract the main ingredient name from this ingredient description for image search. Return ONLY the single most important ingredient word (singular form), nothing else.

Examples:
"2 (6-ounce) salmon fillets, skin on" → salmon
"1 pound thinly sliced beef (e.g., ribeye, sirloin)" → beef
"2 cups purple rice" → rice
"Dipping sauces (e.g., sesame paste, chili oil)" → sauce
"2 cloves garlic, minced" → garlic
"Salt to taste" → salt

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
          maxOutputTokens: 10, // We only need one word
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

    const prompt = `Extract the main ingredient name from each ingredient description for image search. Return ONLY the single most important ingredient word (singular form) for each line, in the same order. One word per line, nothing else.

Examples format:
1. "2 (6-ounce) salmon fillets, skin on" → salmon
2. "1 pound thinly sliced beef (e.g., ribeye, sirloin)" → beef
3. "2 cups purple rice" → rice
4. "Dipping sauces (e.g., sesame paste, chili oil)" → sauce
5. "2 cloves garlic, minced" → garlic

Now simplify these ingredients (return one word per line):
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
          maxOutputTokens: needsFetch.length * 5, // ~5 tokens per ingredient
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
