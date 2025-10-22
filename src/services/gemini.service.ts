import axios from 'axios';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { analyzeRecipeForChefIQ } from '@utils/recipeAnalyzer';
import { Step } from '~/types/recipe';
import {
  createRecipeGenerationPrompt,
  createRecipeParsingPrompt,
  createMultiRecipeParsingPrompt,
  createCookingActionAnalysisPrompt,
  createRecipeFromIngredientsPrompt,
  createMultipleRecipesFromIngredientsPrompt,
} from './constants/recipePrompts';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Rate limiting configuration
// Free tier (15 RPM): Use 5000ms (5 seconds) to stay under limit
// Paid tier (1000 RPM): Use 1000-2000ms (1-2 seconds) for faster processing
const GEMINI_DELAY_BETWEEN_CALLS_MS = 5000; // Change to 2000 for paid tier

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
    const recipe = await parseGeminiResponse(generatedText);

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
    const recipe = await parseGeminiResponse(generatedText, imageUri);

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
        const chunkRecipes = await parseMultiRecipeResponse(generatedText);

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
          await new Promise(resolve => setTimeout(resolve, GEMINI_DELAY_BETWEEN_CALLS_MS));
        }

      } catch (chunkError) {
        console.error(`Error processing chunk ${chunkNum}:`, chunkError);

        // Handle rate limiting (429) or service unavailable (503) with retry
        if (axios.isAxiosError(chunkError) &&
            (chunkError.response?.status === 429 || chunkError.response?.status === 503)) {
          const errorType = chunkError.response?.status === 429 ? 'Rate limit' : 'Service unavailable (503)';
          const waitTime = chunkError.response?.status === 429 ? 10000 : 15000; // 10s for 429, 15s for 503

          console.log(`${errorType} on chunk ${chunkNum}, waiting ${waitTime/1000} seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));

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
              const chunkRecipes = await parseMultiRecipeResponse(data.candidates[0].content.parts[0].text);
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
async function parseGeminiResponse(
  responseText: string,
  imageUri?: string
): Promise<ScrapedRecipe | null> {
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
    if (!Array.isArray(parsed.steps)) {
      parsed.steps = [];
    }

    // Convert instructions to Step objects (handle both old string format and new object format)
    const steps: Step[] = parsed.steps
      .filter((inst: any) => {
        // Handle both string format and object format
        if (typeof inst === 'string') {
          return inst && inst.trim();
        } else if (inst && typeof inst === 'object' && inst.text) {
          return inst.text.trim();
        }
        return false;
      })
      .map((inst: any) => {
        // If already an object with text field, use it; otherwise convert string to object
        if (typeof inst === 'string') {
          return { text: inst };
        } else {
          return { text: inst.text, image: inst.image, cookingAction: inst.cookingAction };
        }
      });

    // Build the ScrapedRecipe object
    const recipe: ScrapedRecipe = {
      title: parsed.title || 'Untitled Recipe',
      description: parsed.description || parsed.notes || '',
      ingredients: cleanIngredientQuantities(parsed.ingredients.filter((ing: any) => ing && ing.trim())),
      steps,
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
    if (recipe.ingredients.length === 0 && recipe.steps.length === 0) {
      console.warn('Parsed recipe has no ingredients or instructions');
      return null;
    }

    // Analyze recipe for ChefIQ appliance suggestions using Gemini AI
    try {
      const chefiqAnalysis = await analyzeCookingActionsWithGemini(
        recipe.title,
        recipe.description,
        recipe.steps,
        recipe.cookTime
      );

      // If Gemini analysis succeeds, use it; otherwise fall back to regex-based analysis
      if (chefiqAnalysis && chefiqAnalysis.suggestedActions && chefiqAnalysis.suggestedActions.length > 0) {
        // Map cooking actions directly to their corresponding steps
        const stepsWithActions = recipe.steps.map((step, index) => {
          const actionForThisStep = chefiqAnalysis.suggestedActions.find(
            (action: any) => action.stepIndex === index
          );
          return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
        });

        recipe.steps = stepsWithActions;
        recipe.chefiqSuggestions = chefiqAnalysis;
        console.log('Using Gemini AI cooking actions');
      } else {
        // Fallback to regex-based analysis
        console.log('Falling back to regex analysis');
        const regexAnalysis = analyzeRecipeForChefIQ(
          recipe.title,
          recipe.description,
          recipe.steps,
          recipe.cookTime
        );

        if (regexAnalysis && regexAnalysis.suggestedActions.length > 0) {
          const stepsWithActions = recipe.steps.map((step, index) => {
            const actionForThisStep = regexAnalysis.suggestedActions.find(
              action => action.stepIndex === index
            );
            return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
          });

          recipe.steps = stepsWithActions;
          recipe.chefiqSuggestions = regexAnalysis;
        }
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
 * Analyzes recipe steps to extract cooking actions using Gemini AI
 * This provides more accurate cooking action detection than regex-based approaches
 * @param title - Recipe title
 * @param description - Recipe description
 * @param steps - Array of recipe steps
 * @param cookTime - Total cook time in minutes
 * @returns ChefIQ cooking action analysis result
 */
export async function analyzeCookingActionsWithGemini(
  title: string,
  description: string,
  steps: Step[],
  cookTime: number
): Promise<any> {
  try {
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not configured for cooking action analysis');
      return null;
    }

    // Format steps as text for the prompt
    const stepsText = steps.map((step, index) => `Step ${index + 1}: ${step.text}`).join('\n');

    // Prepare the prompt for Gemini
    const prompt = createCookingActionAnalysisPrompt(title, description, stepsText, cookTime);

    // Call Gemini API with retry logic for 503 errors
    let response;
    let lastError;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        response = await axios.post(
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
              temperature: 0.1, // Very low temperature for precise analysis
              maxOutputTokens: 4096,
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error;

        // Only retry on 503 (Service Unavailable)
        if (axios.isAxiosError(error) && error.response?.status === 503) {
          if (attempt < maxRetries) {
            const waitTime = 5000 * (attempt + 1); // 5s, 10s (shorter waits for cooking action analysis)
            console.log(`Cooking action analysis 503 error, waiting ${waitTime/1000}s before retry ${attempt + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // For non-503 errors or if we've exhausted retries, throw immediately
        throw error;
      }
    }

    if (!response) {
      throw lastError;
    }

    const data: GeminiResponse = response.data;

    // Check for API errors
    if (data.error) {
      console.error('Gemini cooking action analysis error:', data.error.message);
      return null;
    }

    // Extract the generated text
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('No response from Gemini for cooking action analysis');
      return null;
    }

    // Parse the JSON response
    const analysis = parseCookingActionResponse(generatedText);

    return analysis;
  } catch (error) {
    console.error('Gemini cooking action analysis error:', error);
    return null;
  }
}

/**
 * Parses Gemini's cooking action analysis response
 */
function parseCookingActionResponse(responseText: string): any {
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
    const analysis = JSON.parse(jsonText);

    // Validate structure
    if (!analysis.suggestedActions || !Array.isArray(analysis.suggestedActions)) {
      console.error('Invalid cooking action analysis response');
      return null;
    }

    // Check if any cooking action uses the meat probe (MiniOven with probe parameters)
    const usesProbe = analysis.suggestedActions.some((action: any) => {
      return action.parameters && (
        action.parameters.target_probe_temp !== undefined ||
        action.parameters.remove_probe_temp !== undefined
      );
    });

    // Set useProbe flag if probe is detected
    if (usesProbe) {
      analysis.useProbe = true;
      console.log('Detected meat probe usage in Gemini cooking actions');
    }

    console.log('Gemini cooking action analysis:', analysis);
    return analysis;
  } catch (error) {
    console.error('Failed to parse cooking action response:', error);
    console.error('Response text:', responseText);
    return null;
  }
}

/**
 * Parses Gemini's multi-recipe response into an array of ScrapedRecipe objects
 */
async function parseMultiRecipeResponse(responseText: string, onProgress?: ProgressCallback): Promise<ScrapedRecipe[]> {
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
      if (!Array.isArray(parsed.steps)) {
        parsed.steps = [];
      }

      // Convert instructions to Step objects (handle both old string format and new object format)
      const steps: Step[] = parsed.steps
        .filter((inst: any) => {
          // Handle both string format and object format
          if (typeof inst === 'string') {
            return inst && inst.trim();
          } else if (inst && typeof inst === 'object' && inst.text) {
            return inst.text.trim();
          }
          return false;
        })
        .map((inst: any) => {
          // If already an object with text field, use it; otherwise convert string to object
          if (typeof inst === 'string') {
            return { text: inst };
          } else {
            return { text: inst.text, image: inst.image, cookingAction: inst.cookingAction };
          }
        });

      // Build the ScrapedRecipe object
      const recipe: ScrapedRecipe = {
        title: parsed.title || 'Untitled Recipe',
        description: parsed.description || parsed.notes || '',
        ingredients: cleanIngredientQuantities(parsed.ingredients.filter((ing: any) => ing && ing.trim())),
        steps,
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
      if (recipe.ingredients.length > 0 || recipe.steps.length > 0) {
        onProgress?.(`Processing recipe ${i + 1}/${totalRecipes}: ${recipe.title}`, i + 1, totalRecipes);

        // Analyze recipe for ChefIQ appliance suggestions using Gemini AI
        // This provides more accurate cooking action detection than regex-based approaches
        try {
          const chefiqAnalysis = await analyzeCookingActionsWithGemini(
            recipe.title,
            recipe.description,
            recipe.steps,
            recipe.cookTime
          );

          // If Gemini analysis succeeds, use it; otherwise fall back to regex-based analysis
          if (chefiqAnalysis && chefiqAnalysis.suggestedActions && chefiqAnalysis.suggestedActions.length > 0) {
            // Map cooking actions directly to their corresponding steps
            const stepsWithActions = recipe.steps.map((step, index) => {
              const actionForThisStep = chefiqAnalysis.suggestedActions.find(
                (action: any) => action.stepIndex === index
              );
              return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
            });

            recipe.steps = stepsWithActions;
            recipe.chefiqSuggestions = chefiqAnalysis;
            console.log(`Using Gemini AI cooking actions for ${recipe.title}`);
          } else {
            // Fallback to regex-based analysis
            console.log(`Falling back to regex analysis for ${recipe.title}`);
            const regexAnalysis = analyzeRecipeForChefIQ(
              recipe.title,
              recipe.description,
              recipe.steps,
              recipe.cookTime
            );

            if (regexAnalysis && regexAnalysis.suggestedActions.length > 0) {
              const stepsWithActions = recipe.steps.map((step, index) => {
                const actionForThisStep = regexAnalysis.suggestedActions.find(
                  action => action.stepIndex === index
                );
                return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
              });

              recipe.steps = stepsWithActions;
              recipe.chefiqSuggestions = regexAnalysis;
            }
          }

          // Add delay between Gemini API calls to avoid rate limiting
          if (i < parsedArray.length - 1) {
            await new Promise(resolve => setTimeout(resolve, GEMINI_DELAY_BETWEEN_CALLS_MS));
          }
        } catch (error) {
          console.error('ChefIQ analysis failed for recipe:', recipe.title, error);
          // Don't fail the whole recipe if analysis fails
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

/**
 * Generates recipes from available ingredients with preferences
 * @param ingredients - List of available ingredient names
 * @param dietary - Dietary restriction preference
 * @param cuisine - Cuisine preference
 * @param cookingTime - Cooking time preference
 * @param matchingStrictness - How strict to match ingredients
 * @returns ParsedRecipeResult with generated recipe including substitutions
 */
export async function generateRecipeFromIngredients(
  ingredients: string[],
  dietary?: string,
  cuisine?: string,
  cookingTime?: string,
  matchingStrictness?: 'exact' | 'substitutions' | 'creative'
): Promise<ParsedRecipeResult> {
  try {
    if (!GEMINI_API_KEY) {
      return {
        recipe: null,
        success: false,
        error: 'Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.',
      };
    }

    if (!ingredients || ingredients.length === 0) {
      return {
        recipe: null,
        success: false,
        error: 'No ingredients provided.',
      };
    }

    console.log('Generating recipe from ingredients:', ingredients);
    console.log('Preferences:', { dietary, cuisine, cookingTime, matchingStrictness });

    // Prepare the prompt for Gemini
    const prompt = createRecipeFromIngredientsPrompt(
      ingredients,
      dietary,
      cuisine,
      cookingTime,
      matchingStrictness
    );

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
          maxOutputTokens: 4096,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const data: GeminiResponse = response.data;

    // Check for errors in response
    if (data.error) {
      return {
        recipe: null,
        success: false,
        error: `Gemini API error: ${data.error.message}`,
      };
    }

    // Extract text response
    if (!data.candidates || data.candidates.length === 0) {
      return {
        recipe: null,
        success: false,
        error: 'No response from Gemini API',
      };
    }

    const responseText = data.candidates[0].content.parts[0].text;
    console.log('Gemini response:', responseText);

    // Parse JSON response
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      // Build ScrapedRecipe with additional fields
      const recipe: ScrapedRecipe & {
        missingIngredients?: string[];
        substitutions?: Array<{ missing: string; substitutes: string[] }>;
        matchPercentage?: number;
      } = {
        title: parsed.title || 'Generated Recipe',
        description: parsed.description || '',
        ingredients: parsed.ingredients || [],
        steps: parsed.steps || [],
        cookTime: parsed.cookTime || 30,
        prepTime: parsed.prepTime || 15,
        servings: parsed.servings || 4,
        category: parsed.category || 'Main Course',
        tags: parsed.tags || [],
        missingIngredients: parsed.missingIngredients || [],
        substitutions: parsed.substitutions || [],
        matchPercentage: parsed.matchPercentage || 100,
      };

      console.log('Successfully generated recipe:', recipe.title);

      return {
        recipe,
        success: true,
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return {
        recipe: null,
        success: false,
        error: 'Failed to parse recipe data from Gemini response',
      };
    }
  } catch (error) {
    console.error('Error generating recipe from ingredients:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 429) {
        return {
          recipe: null,
          success: false,
          error: 'API rate limit exceeded. Please try again in a few moments.',
        };
      }
      if (status === 403) {
        return {
          recipe: null,
          success: false,
          error: 'API key is invalid or expired. Please check your EXPO_PUBLIC_GEMINI_API_KEY.',
        };
      }
    }

    return {
      recipe: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Options for generating recipes from ingredients
 */
export interface GenerateRecipesFromIngredientsOptions {
  ingredients: string[];
  numberOfRecipes?: number;
  dietary?: string;
  cuisine?: string;
  cookingTime?: string;
  category?: string;
  matchingStrictness?: 'exact' | 'substitutions' | 'creative';
  excludeTitles?: string[];
}

/**
 * Generates multiple recipe options from available ingredients with preferences
 * @param options - Recipe generation options with named parameters
 * @returns Array of recipes with substitutions
 */
export async function generateMultipleRecipesFromIngredients(
  options: GenerateRecipesFromIngredientsOptions
): Promise<MultiRecipeResult> {
  const {
    ingredients,
    numberOfRecipes = 1,
    dietary,
    cuisine,
    cookingTime,
    category,
    matchingStrictness,
    excludeTitles = [],
  } = options;
  try {
    if (!GEMINI_API_KEY) {
      return {
        recipes: [],
        success: false,
        error: 'Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.',
        totalFound: 0,
      };
    }

    if (!ingredients || ingredients.length === 0) {
      return {
        recipes: [],
        success: false,
        error: 'No ingredients provided.',
        totalFound: 0,
      };
    }

    console.log(`Generating ${numberOfRecipes} recipes from ingredients:`, ingredients);
    console.log('Preferences:', { dietary, cuisine, cookingTime, category, matchingStrictness });
    if (excludeTitles.length > 0) {
      console.log('Excluding previously generated recipes:', excludeTitles);
    }

    // Prepare the prompt for Gemini
    const prompt = createMultipleRecipesFromIngredientsPrompt(
      ingredients,
      numberOfRecipes,
      dietary,
      cuisine,
      cookingTime,
      category,
      matchingStrictness,
      excludeTitles
    );

    // Call Gemini API with retry logic for 503 errors
    let response;
    let lastError;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        response = await axios.post(
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
              temperature: 0.8, // Higher temperature for more variety
              maxOutputTokens: 8192, // More tokens for multiple recipes
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 60000, // 60 second timeout for multiple recipes
          }
        );
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error;

        // Only retry on 503 (Service Unavailable)
        if (axios.isAxiosError(error) && error.response?.status === 503) {
          if (attempt < maxRetries) {
            const waitTime = 10000 * (attempt + 1); // 10s, 20s
            console.log(`Service unavailable (503), waiting ${waitTime/1000}s before retry ${attempt + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // For non-503 errors or if we've exhausted retries, throw immediately
        throw error;
      }
    }

    if (!response) {
      throw lastError;
    }

    const data: GeminiResponse = response.data;

    // Check for errors in response
    if (data.error) {
      return {
        recipes: [],
        success: false,
        error: `Gemini API error: ${data.error.message}`,
        totalFound: 0,
      };
    }

    // Extract text response
    if (!data.candidates || data.candidates.length === 0) {
      return {
        recipes: [],
        success: false,
        error: 'No response from Gemini API',
        totalFound: 0,
      };
    }

    const responseText = data.candidates[0].content.parts[0].text;
    console.log('Gemini response received');

    // Parse JSON response
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsedArray = JSON.parse(jsonStr);

      if (!Array.isArray(parsedArray)) {
        return {
          recipes: [],
          success: false,
          error: 'Expected array of recipes from Gemini',
          totalFound: 0,
        };
      }

      // Build ScrapedRecipe array with additional fields
      const recipes: Array<ScrapedRecipe & {
        missingIngredients?: string[];
        substitutions?: Array<{ missing: string; substitutes: string[] }>;
        matchPercentage?: number;
      }> = [];

      // Process each recipe and analyze for ChefIQ cooking actions
      for (let i = 0; i < parsedArray.length; i++) {
        const parsed = parsedArray[i];

        // Convert steps to Step objects (handle both string format and object format)
        const steps: Step[] = (parsed.steps || [])
          .filter((inst: any) => {
            if (typeof inst === 'string') {
              return inst && inst.trim();
            } else if (inst && typeof inst === 'object' && inst.text) {
              return inst.text.trim();
            }
            return false;
          })
          .map((inst: any) => {
            if (typeof inst === 'string') {
              return { text: inst };
            } else {
              return { text: inst.text, image: inst.image, cookingAction: inst.cookingAction };
            }
          });

        // Build the recipe
        const recipe: ScrapedRecipe & {
          missingIngredients?: string[];
          substitutions?: Array<{ missing: string; substitutes: string[] }>;
          matchPercentage?: number;
        } = {
          title: parsed.title || 'Generated Recipe',
          description: parsed.description || '',
          ingredients: parsed.ingredients || [],
          steps,
          cookTime: parsed.cookTime || 30,
          prepTime: parsed.prepTime || 15,
          servings: parsed.servings || 4,
          category: parsed.category || 'Main Course',
          tags: parsed.tags || [],
          missingIngredients: parsed.missingIngredients || [],
          substitutions: parsed.substitutions || [],
          matchPercentage: parsed.matchPercentage || 100,
        };

        // Analyze recipe for ChefIQ appliance suggestions using Gemini AI
        try {
          const chefiqAnalysis = await analyzeCookingActionsWithGemini(
            recipe.title,
            recipe.description,
            recipe.steps,
            recipe.cookTime
          );

          // If Gemini analysis succeeds, use it; otherwise fall back to regex-based analysis
          if (chefiqAnalysis && chefiqAnalysis.suggestedActions && chefiqAnalysis.suggestedActions.length > 0) {
            // Map cooking actions directly to their corresponding steps
            const stepsWithActions = recipe.steps.map((step, index) => {
              const actionForThisStep = chefiqAnalysis.suggestedActions.find(
                (action: any) => action.stepIndex === index
              );
              return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
            });

            recipe.steps = stepsWithActions;
            recipe.chefiqSuggestions = chefiqAnalysis;
            console.log(`Using Gemini AI cooking actions for ${recipe.title}`);
          } else {
            // Fallback to regex-based analysis
            console.log(`Falling back to regex analysis for ${recipe.title}`);
            const regexAnalysis = analyzeRecipeForChefIQ(
              recipe.title,
              recipe.description,
              recipe.steps,
              recipe.cookTime
            );

            if (regexAnalysis && regexAnalysis.suggestedActions.length > 0) {
              const stepsWithActions = recipe.steps.map((step, index) => {
                const actionForThisStep = regexAnalysis.suggestedActions.find(
                  action => action.stepIndex === index
                );
                return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
              });

              recipe.steps = stepsWithActions;
              recipe.chefiqSuggestions = regexAnalysis;
            }
          }

          // Add delay between Gemini API calls to avoid rate limiting
          if (i < parsedArray.length - 1) {
            await new Promise(resolve => setTimeout(resolve, GEMINI_DELAY_BETWEEN_CALLS_MS));
          }
        } catch (error) {
          console.error('ChefIQ analysis failed for recipe:', recipe.title, error);
          // Don't fail the whole recipe if analysis fails
        }

        recipes.push(recipe);
      }

      console.log(`Successfully generated ${recipes.length} recipes`);

      return {
        recipes,
        success: true,
        totalFound: recipes.length,
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return {
        recipes: [],
        success: false,
        error: 'Failed to parse recipe data from Gemini response',
        totalFound: 0,
      };
    }
  } catch (error) {
    console.error('Error generating multiple recipes from ingredients:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 429) {
        return {
          recipes: [],
          success: false,
          error: 'API rate limit exceeded. Please try again in a few moments.',
          totalFound: 0,
        };
      }
      if (status === 403) {
        return {
          recipes: [],
          success: false,
          error: 'API key is invalid or expired. Please check your EXPO_PUBLIC_GEMINI_API_KEY.',
          totalFound: 0,
        };
      }
      if (status === 503) {
        return {
          recipes: [],
          success: false,
          error: 'AI service is temporarily unavailable. Please try again in a few moments.',
          totalFound: 0,
        };
      }
    }

    return {
      recipes: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      totalFound: 0,
    };
  }
}
