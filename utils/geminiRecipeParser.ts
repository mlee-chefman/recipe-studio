import axios from 'axios';
import { ScrapedRecipe } from './recipeScraper';
import { analyzeRecipeForChefIQ } from './recipeAnalyzer';

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
  "notes": "Any additional notes, tips, or variations mentioned (if available, otherwise empty string)"
}

Guidelines:
1. **Title**: Extract the recipe name. If unclear, use "Untitled Recipe"
2. **Description**: Include any description, intro text, or summary about the dish
3. **Ingredients**: Parse into a clean array. Include quantities and units. Each ingredient should be a separate string
4. **Instructions**: Parse into numbered steps. Each step should be a separate string. Organize chronologically
5. **Times**: Extract prep time and cook time in minutes. If not specified, use reasonable defaults (prepTime: 15, cookTime: 30)
6. **Servings**: Extract number of servings. If not specified, default to 4
7. **Category**: Infer category from the recipe (e.g., "Dessert", "Main Course", "Appetizer", "Soup", "Salad", "Breakfast", etc.)
8. **Notes**: Include any tips, variations, storage instructions, or additional notes

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
      ingredients: parsed.ingredients.filter((ing: any) => ing && ing.trim()),
      instructions: parsed.instructions.filter((inst: any) => inst && inst.trim()),
      cookTime: parseInt(parsed.cookTime) || 30,
      prepTime: parseInt(parsed.prepTime) || 15,
      servings: parseInt(parsed.servings) || 4,
      category: parsed.category || 'General',
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
