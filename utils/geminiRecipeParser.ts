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

export interface MultiRecipeResult {
  recipes: ScrapedRecipe[];
  success: boolean;
  error?: string;
  totalFound: number;
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
3. **Ingredients**: List all ingredients with specific quantities and units (e.g., "2 cups flour", "1 lb pork chops")
4. **Instructions**: Write clear, numbered steps in chronological order. Be specific about temperatures, times, and techniques
5. **Times**: Provide realistic prep time and cook time in minutes
6. **Servings**: Specify number of servings (typically 4-6)
7. **Category**: Choose the most appropriate category (e.g., Main Course, Dessert, Appetizer, etc.)
8. **Tags**: Add 2-5 relevant tags (e.g., "Quick", "Healthy", "Vegetarian", "Spicy", "Italian", "Kid-Friendly", "Gluten-Free", etc.)
9. **Notes**: Include helpful tips, substitutions, or serving suggestions

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
3. **Ingredients**: Parse into a clean array. Include quantities and units. Each ingredient should be a separate string
4. **Instructions**: Parse into numbered steps. Each step should be a separate string. Organize chronologically
5. **Times**: Extract prep time and cook time in minutes. If not specified, use reasonable defaults (prepTime: 15, cookTime: 30)
6. **Servings**: Extract number of servings. If not specified, default to 4
7. **Category**: Infer category from the recipe (e.g., "Dessert", "Main Course", "Appetizer", "Soup", "Salad", "Breakfast", etc.)
8. **Tags**: Infer 2-5 relevant tags based on the recipe (e.g., "Quick", "Vegetarian", "Italian", "Spicy", "Kid-Friendly", "Healthy", etc.)
9. **Notes**: Include any tips, variations, storage instructions, or additional notes

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
 * Parses text containing multiple recipes (from PDF cookbooks or notes) using Gemini
 * @param text - Large text block that may contain multiple recipes
 * @returns MultiRecipeResult with array of parsed recipes
 */
export async function parseMultipleRecipes(
  text: string
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

    // Prepare the prompt for Gemini to identify and parse multiple recipes
    const prompt = createMultiRecipeParsingPrompt(text);

    // Call Gemini API with higher token limit for multiple recipes
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
          maxOutputTokens: 8192, // Higher limit for multiple recipes
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // Longer timeout for processing multiple recipes
      }
    );

    const data: GeminiResponse = response.data;

    // Check for API errors
    if (data.error) {
      return {
        recipes: [],
        success: false,
        error: `Gemini API error: ${data.error.message}`,
        totalFound: 0,
      };
    }

    // Extract the generated text
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return {
        recipes: [],
        success: false,
        error: 'No response from Gemini API',
        totalFound: 0,
      };
    }

    // Parse the JSON array response from Gemini
    const recipes = parseMultiRecipeResponse(generatedText);

    if (recipes.length === 0) {
      return {
        recipes: [],
        success: false,
        error: 'No recipes found in the text. The text may not contain any recognizable recipes.',
        totalFound: 0,
      };
    }

    return {
      recipes,
      success: true,
      totalFound: recipes.length,
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
 * Creates a prompt for Gemini to parse multiple recipes from text
 */
function createMultiRecipeParsingPrompt(text: string): string {
  return `You are a recipe parsing assistant specialized in extracting multiple recipes from text blocks, PDF cookbooks, or personal notes.

Your task is to:
1. Identify all recipes in the text below
2. Parse each recipe into a structured format
3. Return an array of recipe objects

The text may contain:
- Multiple recipes from a cookbook
- Recipes with informal formatting from personal notes
- Mixed content (stories, tips) - extract only the recipes

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
3. **Ingredients**: Parse into clean array with quantities and units
4. **Instructions**: Break into clear, sequential steps
5. **Times**: Extract or estimate reasonable times in minutes
6. **Servings**: Extract or default to 4
7. **Category**: Infer from recipe type (e.g., "Main Course", "Dessert", "Appetizer")
8. **Tags**: Infer 2-5 relevant tags (e.g., "Quick", "Vegetarian", "Italian", "Spicy", "American", "French", "Healthy", etc.)
9. **Notes**: Include any tips, variations, or serving suggestions

Important:
- Return an array of recipe objects: [recipe1, recipe2, ...]
- If only one recipe is found, return an array with one item
- Clean up formatting errors and fix obvious mistakes
- Skip non-recipe content (introductions, stories, etc.)
- If a recipe is incomplete, fill in reasonable defaults
- Return ONLY valid JSON array, no additional text
- Make sure the JSON is properly formatted

Text to parse:
"""
${text}
"""

Return the recipes as a JSON array:`;
}

/**
 * Parses Gemini's multi-recipe response into an array of ScrapedRecipe objects
 */
function parseMultiRecipeResponse(responseText: string): ScrapedRecipe[] {
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

    // Process each recipe
    for (const parsed of parsedArray) {
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
