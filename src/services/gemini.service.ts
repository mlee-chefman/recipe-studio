import axios from 'axios';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { analyzeRecipeForChefIQ } from '@utils/recipeAnalyzer';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface GeminiResponse {
  candidates?: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  error?: {
    message: string;
    code: number;
  };
}

export interface ParsedRecipeResult {
  recipe: ScrapedRecipe | null;
  success: boolean;
  error?: string;
}

export interface MultiRecipeResult {
  recipes: ScrapedRecipe[];
  success: boolean;
  error?: string;
  totalFound: number;
}

export interface ProgressCallback {
  (status: string, recipesFound?: number, totalEstimate?: number): void;
}

/**
 * Generates a complete recipe from a simple description using Google Gemini
 * @param description - Simple description like "simple pork chop" or "easy chicken pasta"
 * @returns ParsedRecipeResult with generated recipe data
 */
export async function generateRecipeFromDescription(
  description: string
): Promise<ParsedRecipeResult> {
  try {
    if (!GEMINI_API_KEY) {
      return {
        recipe: null,
        success: false,
        error: 'Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.',
      };
    }

    if (!description || description.trim().length === 0) {
      return {
        recipe: null,
        success: false,
        error: 'No description provided.',
      };
    }

    // Prepare the prompt for Gemini
    const prompt = createRecipeGenerationPrompt(description);

    // Call Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7, // Higher temperature for more creative recipes
          maxOutputTokens: 2048,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const data: GeminiResponse = response.data;

    // Check for API errors
    if (data.error) {
      return {
        recipe: null,
        success: false,
        error: `Gemini API error: ${data.error.message}`,
      };
    }

    // Extract the generated text
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return {
        recipe: null,
        success: false,
        error: 'No response from Gemini API',
      };
    }

    // Parse the JSON response from Gemini
    const recipe = parseGeminiResponse(generatedText);

    if (!recipe) {
      return {
        recipe: null,
        success: false,
        error: 'Failed to parse recipe from Gemini response',
      };
    }

    return {
      recipe,
      success: true,
    };
  } catch (error) {
    console.error('Gemini generation error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      if (status === 429) {
        return {
          recipe: null,
          success: false,
          error: 'API rate limit exceeded. Please try again in a moment.',
        };
      }

      if (status === 403) {
        return {
          recipe: null,
          success: false,
          error: 'API key is invalid or restricted. Please check your Gemini API key configuration.',
        };
      }

      return {
        recipe: null,
        success: false,
        error: `API error: ${message}`,
      };
    }

    return {
      recipe: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Parses OCR-extracted text into a structured recipe format using Google Gemini
 * @param ocrText - Raw text extracted from image via OCR
 * @param imageUri - Original image URI (optional, for including in result)
 * @returns ParsedRecipeResult with structured recipe data
 */
export async function parseRecipeWithGemini(
  ocrText: string,
  imageUri?: string
): Promise<ParsedRecipeResult> {
  try {
    if (!GEMINI_API_KEY) {
      return {
        recipe: null,
        success: false,
        error: 'Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.',
      };
    }

    if (!ocrText || ocrText.trim().length === 0) {
      return {
        recipe: null,
        success: false,
        error: 'No text provided to parse.',
      };
    }

    // Prepare the prompt for Gemini
    const prompt = createRecipeParsingPrompt(ocrText);

    // Call Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent parsing
          maxOutputTokens: 2048,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const data: GeminiResponse = response.data;

    // Check for API errors
    if (data.error) {
      return {
        recipe: null,
        success: false,
        error: `Gemini API error: ${data.error.message}`,
      };
    }

    // Extract the generated text
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return {
        recipe: null,
        success: false,
        error: 'No response from Gemini API',
      };
    }

    // Parse the JSON response from Gemini
    const recipe = parseGeminiResponse(generatedText, imageUri);

    if (!recipe) {
      return {
        recipe: null,
        success: false,
        error: 'Failed to parse recipe from Gemini response',
      };
    }

    return {
      recipe,
      success: true,
    };
  } catch (error) {
    console.error('Gemini parsing error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      if (status === 429) {
        return {
          recipe: null,
          success: false,
          error: 'API rate limit exceeded. Please try again in a moment.',
        };
      }

      if (status === 403) {
        return {
          recipe: null,
          success: false,
          error: 'API key is invalid or restricted. Please check your Gemini API key configuration.',
        };
      }

      return {
        recipe: null,
        success: false,
        error: `API error: ${message}`,
      };
    }

    return {
      recipe: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Parses text containing multiple recipes (from PDF cookbooks or notes) using Gemini
 * Uses batch processing for large documents to ensure all recipes are extracted
 * @param text - Large text block that may contain multiple recipes
 * @param onProgress - Optional callback to report progress
 * @returns MultiRecipeResult with array of parsed recipes
 */
export async function parseMultipleRecipes(
  text: string,
  onProgress?: ProgressCallback
): Promise<MultiRecipeResult> {
  try {
    if (!GEMINI_API_KEY) {
      return {
        recipes: [],
        success: false,
        error: 'Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.',
        totalFound: 0,
      };
    }

    if (!text || text.trim().length === 0) {
      return {
        recipes: [],
        success: false,
        error: 'No text provided to parse.',
        totalFound: 0,
      };
    }

    // Log total text length to debug extraction issues
    console.log(`Total text length from PDF: ${text.length} characters`);
    console.log(`First 500 chars: ${text.substring(0, 500).replace(/\n/g, ' ')}`);
    console.log(`Last 500 chars: ${text.substring(text.length - 500).replace(/\n/g, ' ')}`);

    // Estimate number of recipes based on text patterns
    const estimatedRecipes = estimateRecipeCount(text);

    onProgress?.('Analyzing cookbook structure...', 0, estimatedRecipes);

    // Split text into chunks for batch processing
    // This ensures we don't miss recipes due to token limits
    // Use smaller chunks to ensure even distribution and prevent any single chunk from being too large
    const chunks = splitTextIntoChunks(text, 6000); // ~6k chars per chunk for better coverage
    const totalChunks = chunks.length;

    console.log(`Split cookbook into ${totalChunks} chunks for processing`);
    console.log(`Estimated ${estimatedRecipes} recipes total`);
    chunks.forEach((chunk, i) => {
      console.log(`Chunk ${i + 1}: ${chunk.length} characters, preview: ${chunk.substring(0, 100).replace(/\n/g, ' ')}...`);
    });

    onProgress?.(`Processing ${totalChunks} section${totalChunks > 1 ? 's' : ''}...`, 0, estimatedRecipes);

    const allRecipes: ScrapedRecipe[] = [];

    // Process each chunk
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const chunkNum = chunkIndex + 1;

      onProgress?.(
        `Processing section ${chunkNum}/${totalChunks}...`,
        allRecipes.length,
        estimatedRecipes
      );

      try {
        console.log(`\n=== Processing Chunk ${chunkNum}/${totalChunks} ===`);
        console.log(`Chunk size: ${chunk.length} characters`);

        // Prepare the prompt for this chunk
        const prompt = createMultiRecipeParsingPrompt(chunk);

        // Call Gemini API
        const response = await axios.post(
          `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1, // Very low temperature for thorough, complete extraction
              maxOutputTokens: 16384, // Reasonable limit per chunk
              topP: 0.95,
              topK: 40,
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 120000, // 2 minutes per chunk
          }
        );

        const data: GeminiResponse = response.data;

        // Check for API errors
        if (data.error) {
          console.error(`Error processing chunk ${chunkNum}:`, data.error.message);
          continue; // Skip this chunk and continue with others
        }

        // Extract the generated text
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
          console.warn(`No response for chunk ${chunkNum}`);
          continue;
        }

        // Parse the JSON array response from Gemini
        const chunkRecipes = parseMultiRecipeResponse(generatedText);

        console.log(`Chunk ${chunkNum} found ${chunkRecipes.length} recipes`);
        if (chunkRecipes.length > 0) {
          console.log(`Recipe titles in chunk ${chunkNum}:`, chunkRecipes.map(r => r.title).join(', '));
        } else {
          console.log(`Chunk ${chunkNum} had no recipes - might be storage guides or other content`);
          console.log(`First 200 chars of chunk: ${chunk.substring(0, 200).replace(/\n/g, ' ')}`);
        }

        // Add recipes from this chunk
        allRecipes.push(...chunkRecipes);

        onProgress?.(
          `Found ${allRecipes.length} recipes so far...`,
          allRecipes.length,
          Math.max(estimatedRecipes, allRecipes.length)
        );

        // Delay between chunks to avoid rate limiting
        if (chunkIndex < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
        }

      } catch (chunkError) {
        console.error(`Error processing chunk ${chunkNum}:`, chunkError);

        // Handle rate limiting with retry
        if (axios.isAxiosError(chunkError) && chunkError.response?.status === 429) {
          console.log(`Rate limit hit on chunk ${chunkNum}, waiting 10 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 10000));

          // Retry once
          try {
            console.log(`Retrying chunk ${chunkNum}...`);
            const prompt = createMultiRecipeParsingPrompt(chunk);
            const retryResponse = await axios.post(
              `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
              {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 16384,
                  topP: 0.95,
                  topK: 40,
                },
              },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000,
              }
            );

            const data: GeminiResponse = retryResponse.data;
            if (!data.error && data.candidates?.[0]?.content?.parts?.[0]?.text) {
              const chunkRecipes = parseMultiRecipeResponse(data.candidates[0].content.parts[0].text);
              console.log(`Retry successful: Chunk ${chunkNum} found ${chunkRecipes.length} recipes`);
              allRecipes.push(...chunkRecipes);
            }
          } catch (retryError) {
            console.error(`Retry failed for chunk ${chunkNum}:`, retryError);
          }
        }

        continue;
      }
    }

    if (allRecipes.length === 0) {
      return {
        recipes: [],
        success: false,
        error: 'No recipes found in the text. The text may not contain any recognizable recipes.',
        totalFound: 0,
      };
    }

    // Remove duplicate recipes (can happen with overlapping chunks)
    const uniqueRecipes = deduplicateRecipes(allRecipes);
    console.log(`Total recipes before deduplication: ${allRecipes.length}`);
    console.log(`Total unique recipes: ${uniqueRecipes.length}`);

    onProgress?.('Completed!', uniqueRecipes.length, uniqueRecipes.length);

    return {
      recipes: uniqueRecipes,
      success: true,
      totalFound: uniqueRecipes.length,
    };
  } catch (error) {
    console.error('Multi-recipe parsing error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      if (status === 429) {
        return {
          recipes: [],
          success: false,
          error: 'API rate limit exceeded. Please try again in a moment.',
          totalFound: 0,
        };
      }

      if (status === 403) {
        return {
          recipes: [],
          success: false,
          error: 'API key is invalid or restricted. Please check your Gemini API key configuration.',
          totalFound: 0,
        };
      }

      return {
        recipes: [],
        success: false,
        error: `API error: ${message}`,
        totalFound: 0,
      };
    }

    return {
      recipes: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      totalFound: 0,
    };
  }
}

/**
 * Creates a prompt for Gemini to generate a complete recipe from a description
 */
function createRecipeGenerationPrompt(description: string): string {
  return `You are a professional chef and recipe creator. Your task is to create a complete, detailed recipe based on the user's description.

User's request: "${description}"

Please create a delicious recipe that matches this description. The recipe should be practical, clear, and easy to follow.

Return a JSON object with the following structure:

{
  "title": "Recipe title",
  "description": "A brief, appetizing description of the dish (1-2 sentences)",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "instructions": ["step 1", "step 2", ...],
  "cookTime": 30,
  "prepTime": 15,
  "servings": 4,
  "category": "category name (e.g., Main Course, Dessert, etc.)",
  "tags": ["tag1", "tag2", "tag3"],
  "notes": "Any helpful tips, variations, or serving suggestions"
}

Guidelines:
1. **Title**: Create a clear, appetizing title that matches the request
2. **Description**: Write 1-2 sentences describing the dish and why it's delicious
3. **Ingredients**: List all ingredients with specific quantities and units (e.g., "2 cups flour", "1 lb pork chops", "1/3 cup milk"). Use fractions (1/2, 1/3, 1/4) instead of decimals for measurements
4. **Instructions**: Write clear, numbered steps in chronological order. Be specific about temperatures, times, and techniques. For meat dishes (especially steaks, roasts, or large cuts), include internal temperature targets and mention if the meat should be removed at a lower temperature to rest (e.g., "Cook until internal temperature reaches 130°F, then remove and let rest 5-10 minutes")
5. **Times**: Provide realistic prep time and cook time in minutes
6. **Servings**: Specify number of servings (typically 4-6)
7. **Category**: Choose the most appropriate category (e.g., Main Course, Dessert, Appetizer, etc.)
8. **Tags**: Add 2-5 relevant tags (e.g., "Quick", "Healthy", "Vegetarian", "Spicy", "Italian", "Kid-Friendly", "Gluten-Free", etc.)
9. **Notes**: Include helpful tips, substitutions, or serving suggestions. For large meat dishes, mention resting time and carryover cooking if applicable

Important:
- Make the recipe practical and achievable for home cooks
- Use common ingredients when possible
- Be specific about cooking temperatures and times
- If the request is vague (like "simple pork chop"), create a straightforward, beginner-friendly version
- Return ONLY valid JSON, no additional text
- Make sure the JSON is properly formatted and can be parsed

Return the recipe as JSON:`;
}

/**
 * Creates a detailed prompt for Gemini to parse recipe text
 */
function createRecipeParsingPrompt(ocrText: string): string {
  return `You are a recipe parsing assistant. Your task is to extract and organize recipe information from OCR-extracted text.

The text below was extracted from a recipe image using OCR. It may contain errors, inconsistent formatting, or incomplete information.

Please parse this text and return a JSON object with the following structure:

{
  "title": "Recipe title",
  "description": "Brief description or summary (if available, otherwise empty string)",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "cookTime": 30,
  "prepTime": 15,
  "servings": 4,
  "category": "category name (e.g., Dessert, Main Course, etc.)",
  "tags": ["tag1", "tag2", "tag3"],
  "notes": "Any additional notes, tips, or variations mentioned (if available, otherwise empty string)"
}

Guidelines:
1. **Title**: Extract the recipe name. If unclear, use "Untitled Recipe"
2. **Description**: Include any description, intro text, or summary about the dish
3. **Ingredients**: Parse into a clean array. Include quantities and units. Each ingredient should be a separate string. Use fractions (1/2, 1/3, 1/4) instead of decimals for measurements (e.g., "1/3 cup" not "0.33 cup")
4. **Instructions**: Parse into numbered steps. Each step should be a separate string. Organize chronologically. Preserve any mentions of internal temperatures, remove temperatures, or resting times (e.g., "remove at 160°F", "let rest 10 minutes")
5. **Times**: Extract prep time and cook time in minutes. If not specified, use reasonable defaults (prepTime: 15, cookTime: 30)
6. **Servings**: Extract number of servings. If not specified, default to 4
7. **Category**: Infer category from the recipe (e.g., "Dessert", "Main Course", "Appetizer", "Soup", "Salad", "Breakfast", etc.)
8. **Tags**: Infer 2-5 relevant tags based on the recipe (e.g., "Quick", "Vegetarian", "Italian", "Spicy", "Kid-Friendly", "Healthy", etc.)
9. **Notes**: Include any tips, variations, storage instructions, or additional notes. Preserve any mentions of resting time or carryover cooking for meat dishes

Important:
- Fix obvious OCR errors (e.g., "1 cuρ" → "1 cup")
- Organize instructions as clear, sequential steps
- If information is missing, use reasonable defaults
- Return ONLY valid JSON, no additional text
- Make sure the JSON is properly formatted and can be parsed

OCR Text:
"""
${ocrText}
"""

Return the parsed recipe as JSON:`;
}

/**
 * Creates a prompt for Gemini to parse multiple recipes from text
 */
function createMultiRecipeParsingPrompt(text: string): string {
  return `You are a recipe parsing assistant specialized in extracting multiple recipes from text blocks, PDF cookbooks, or personal notes.

CRITICAL: You MUST extract EVERY SINGLE RECIPE in the text. Do not stop early. Count all recipes first, then extract all of them.

Your task is to:
1. Carefully scan the ENTIRE text to identify ALL recipes (look for recipe titles, ingredients lists, instructions)
2. Parse EVERY recipe into a structured format - don't stop at 10 or 15, continue until you've processed the entire text
3. Return an array containing ALL recipe objects found

The text may contain:
- Multiple recipes from a cookbook (could be 20, 30, or more recipes)
- Recipes with informal formatting from personal notes
- Mixed content (stories, tips, storage guides) - extract only the recipes
- Table of contents - use this to verify you found all recipes

For each recipe found, return a JSON object with this structure:

{
  "title": "Recipe title",
  "description": "Brief description (if available)",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "cookTime": 30,
  "prepTime": 15,
  "servings": 4,
  "category": "category name",
  "tags": ["tag1", "tag2", "tag3"],
  "notes": "Any additional notes or tips"
}

Guidelines:
1. **Identify recipe boundaries**: Look for recipe titles, "Ingredients", "Instructions" headers
2. **Title**: Extract or create a descriptive title for each recipe
3. **Ingredients**: Parse into clean array with quantities and units. Use fractions (1/2, 1/3, 1/4) instead of decimals for measurements (e.g., "1/3 cup" not "0.33 cup")
4. **Instructions**: Break into clear, sequential steps. Preserve any mentions of internal temperatures, remove temperatures, or resting times for meat dishes
5. **Times**: Extract or estimate reasonable times in minutes
6. **Servings**: Extract or default to 4
7. **Category**: Infer from recipe type (e.g., "Main Course", "Dessert", "Appetizer")
8. **Tags**: Infer 2-5 relevant tags (e.g., "Quick", "Vegetarian", "Italian", "Spicy", "American", "French", "Healthy", etc.)
9. **Notes**: Include any tips, variations, or serving suggestions. Preserve any mentions of resting time or carryover cooking for meat dishes

Important:
- Return an array of recipe objects: [recipe1, recipe2, ...]
- If only one recipe is found, return an array with one item
- Clean up formatting errors and fix obvious mistakes
- Skip non-recipe content (introductions, stories, storage guides, cooking tools lists, etc.)
- If a recipe is incomplete, fill in reasonable defaults
- Return ONLY valid JSON array, no additional text
- Make sure the JSON is properly formatted
- DO NOT STOP until you have processed the ENTIRE text and extracted ALL recipes
- If you see a table of contents with 27 recipes, you must return 27 recipes in the array

Text to parse:
"""
${text}
"""

IMPORTANT: Extract ALL recipes from the text above. Do not stop after 10-15 recipes. Continue processing until you reach the end of the text.

Return the recipes as a JSON array:`;
}

/**
 * Estimates the number of recipes in text based on common patterns
 */
function estimateRecipeCount(text: string): number {
  const textLower = text.toLowerCase();

  // Count occurrences of common recipe headers
  const ingredientMatches = textLower.match(/\b(ingredients?|what you need)\b/gi);
  const instructionMatches = textLower.match(/\b(instructions?|directions?|method|steps?|how to make)\b/gi);

  // Use the higher count as estimate
  const estimate = Math.max(
    ingredientMatches?.length || 0,
    instructionMatches?.length || 0,
    1 // Minimum 1 recipe
  );

  return estimate;
}

/**
 * Splits text into chunks for batch processing of large cookbooks
 * Uses simple overlapping windows to ensure no recipes are missed
 */
function splitTextIntoChunks(text: string, maxChunkSize: number = 6000): string[] {
  // If text is small enough, return as single chunk
  if (text.length <= maxChunkSize) {
    console.log(`Text is small (${text.length} chars), using single chunk`);
    return [text];
  }

  const chunks: string[] = [];
  const overlapSize = 1000; // Smaller overlap for smaller chunks

  console.log(`Text is ${text.length} characters, splitting into chunks of ${maxChunkSize} with ${overlapSize} char overlap`);

  // Simple approach: split into overlapping windows
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + maxChunkSize, text.length);
    const chunk = text.substring(startIndex, endIndex);

    chunks.push(chunk);
    console.log(`Created chunk ${chunks.length}: starts at char ${startIndex}, length ${chunk.length}`);

    // Move forward by chunk size minus overlap
    // This ensures recipes near boundaries are captured in both chunks
    startIndex += (maxChunkSize - overlapSize);

    // If we're near the end, just take the rest
    if (text.length - startIndex <= maxChunkSize) {
      // Add final chunk and break
      if (startIndex < text.length) {
        const finalChunk = text.substring(startIndex);
        if (finalChunk.length > 500) { // Only add if substantial
          chunks.push(finalChunk);
          console.log(`Created final chunk ${chunks.length}: starts at char ${startIndex}, length ${finalChunk.length}`);
        }
      }
      break;
    }
  }

  console.log(`Created ${chunks.length} overlapping chunks`);
  return chunks;
}

/**
 * Removes duplicate recipes that may have been captured in overlapping chunks
 * Uses title similarity to detect duplicates
 */
function deduplicateRecipes(recipes: ScrapedRecipe[]): ScrapedRecipe[] {
  const uniqueRecipes: ScrapedRecipe[] = [];
  const seenTitles = new Set<string>();

  for (const recipe of recipes) {
    // Normalize title for comparison (lowercase, remove extra spaces/punctuation)
    const normalizedTitle = recipe.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

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
 * Cleans up ingredient quantities by rounding excessive decimal places
 * Converts values like "0.3333333334326744 cup" to "0.33 cup"
 */
function cleanIngredientQuantities(ingredients: string[]): string[] {
  return ingredients.map(ingredient => {
    // Match decimal numbers with more than 2 decimal places
    return ingredient.replace(/(\d+\.\d{3,})/g, (match) => {
      const num = parseFloat(match);
      return num.toFixed(2);
    });
  });
}

/**
 * Parses Gemini's text response into a ScrapedRecipe object
 */
function parseGeminiResponse(
  responseText: string,
  imageUri?: string
): ScrapedRecipe | null {
  try {
    // Extract JSON from the response (handle markdown code blocks)
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse the JSON
    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.title) {
      parsed.title = 'Untitled Recipe';
    }

    // Ensure arrays exist
    if (!Array.isArray(parsed.ingredients)) {
      parsed.ingredients = [];
    }
    if (!Array.isArray(parsed.instructions)) {
      parsed.instructions = [];
    }

    // Build the ScrapedRecipe object
    const recipe: ScrapedRecipe = {
      title: parsed.title || 'Untitled Recipe',
      description: parsed.description || parsed.notes || '',
      ingredients: cleanIngredientQuantities(parsed.ingredients.filter((ing: any) => ing && ing.trim())),
      instructions: parsed.instructions.filter((inst: any) => inst && inst.trim()),
      cookTime: parseInt(parsed.cookTime) || 30,
      prepTime: parseInt(parsed.prepTime) || 15,
      servings: parseInt(parsed.servings) || 4,
      category: parsed.category || 'General',
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((tag: any) => tag && tag.trim()) : [],
      image: imageUri,
    };

    // Append notes to description if both exist
    if (parsed.notes && parsed.notes !== parsed.description) {
      recipe.description = recipe.description
        ? `${recipe.description}\n\nNotes: ${parsed.notes}`
        : `Notes: ${parsed.notes}`;
    }

    // Validate that we have at least some content
    if (recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
      console.warn('Parsed recipe has no ingredients or instructions');
      return null;
    }

    // Analyze recipe for ChefIQ appliance suggestions
    // This uses all the existing extract*Params functions to get precise cooking parameters
    try {
      const chefiqAnalysis = analyzeRecipeForChefIQ(
        recipe.title,
        recipe.description,
        recipe.instructions,
        recipe.cookTime
      );

      // Attach ChefIQ suggestions to the recipe
      if (chefiqAnalysis && chefiqAnalysis.suggestedActions.length > 0) {
        recipe.chefiqSuggestions = chefiqAnalysis;
        console.log('ChefIQ Analysis:', chefiqAnalysis);
      }
    } catch (error) {
      console.error('ChefIQ analysis failed:', error);
      // Don't fail the whole recipe if analysis fails
    }

    return recipe;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    console.error('Response text:', responseText);
    return null;
  }
}

/**
 * Parses Gemini's multi-recipe response into an array of ScrapedRecipe objects
 */
function parseMultiRecipeResponse(responseText: string, onProgress?: ProgressCallback): ScrapedRecipe[] {
  try {
    // Extract JSON from the response (handle markdown code blocks)
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse the JSON array
    const parsedArray = JSON.parse(jsonText);

    // Ensure it's an array
    if (!Array.isArray(parsedArray)) {
      console.error('Response is not an array');
      return [];
    }

    const recipes: ScrapedRecipe[] = [];
    const totalRecipes = parsedArray.length;

    onProgress?.(`Processing ${totalRecipes} recipes...`, 0, totalRecipes);

    // Process each recipe
    for (let i = 0; i < parsedArray.length; i++) {
      const parsed = parsedArray[i];
      // Validate required fields
      if (!parsed.title) {
        parsed.title = 'Untitled Recipe';
      }

      // Ensure arrays exist
      if (!Array.isArray(parsed.ingredients)) {
        parsed.ingredients = [];
      }
      if (!Array.isArray(parsed.instructions)) {
        parsed.instructions = [];
      }

      // Build the ScrapedRecipe object
      const recipe: ScrapedRecipe = {
        title: parsed.title || 'Untitled Recipe',
        description: parsed.description || parsed.notes || '',
        ingredients: cleanIngredientQuantities(parsed.ingredients.filter((ing: any) => ing && ing.trim())),
        instructions: parsed.instructions.filter((inst: any) => inst && inst.trim()),
        cookTime: parseInt(parsed.cookTime) || 30,
        prepTime: parseInt(parsed.prepTime) || 15,
        servings: parseInt(parsed.servings) || 4,
        category: parsed.category || 'General',
        tags: Array.isArray(parsed.tags) ? parsed.tags.filter((tag: any) => tag && tag.trim()) : [],
        image: '',
      };

      // Append notes to description if both exist
      if (parsed.notes && parsed.notes !== parsed.description) {
        recipe.description = recipe.description
          ? `${recipe.description}\n\nNotes: ${parsed.notes}`
          : `Notes: ${parsed.notes}`;
      }

      // Only add recipes with some content
      if (recipe.ingredients.length > 0 || recipe.instructions.length > 0) {
        onProgress?.(`Processing recipe ${i + 1}/${totalRecipes}: ${recipe.title}`, i + 1, totalRecipes);

        // Analyze recipe for ChefIQ appliance suggestions
        try {
          const chefiqAnalysis = analyzeRecipeForChefIQ(
            recipe.title,
            recipe.description,
            recipe.instructions,
            recipe.cookTime
          );

          if (chefiqAnalysis && chefiqAnalysis.suggestedActions.length > 0) {
            recipe.chefiqSuggestions = chefiqAnalysis;
          }
        } catch (error) {
          console.error('ChefIQ analysis failed for recipe:', recipe.title, error);
        }

        recipes.push(recipe);
      }
    }

    return recipes;
  } catch (error) {
    console.error('Failed to parse multi-recipe response:', error);
    console.error('Response text:', responseText);
    return [];
  }
}
