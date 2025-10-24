import axios from 'axios';
import { Recipe, Step } from '../types/recipe';
import { uploadBase64ImageToStorage } from '../utils/imageUpload';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict';

// Cost per image: $0.03 (as of 2025)
export const IMAGEN_COST_PER_IMAGE = 0.03;

/**
 * Available aspect ratios for Imagen 3
 */
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

/**
 * Options for image generation
 */
export interface ImageGenerationOptions {
  aspectRatio?: AspectRatio;
  sampleCount?: number; // Number of images to generate (1-4)
}

/**
 * Result from image generation
 */
export interface ImageGenerationResult {
  success: boolean;
  images?: string[]; // Base64 encoded images
  downloadURLs?: string[]; // Firebase Storage URLs (if uploaded)
  error?: string;
  prompt?: string; // The prompt used for generation
}

/**
 * Builds a detailed, optimized prompt for food photography based on recipe data
 * @param recipe - Recipe object containing title, description, ingredients, etc.
 * @returns Optimized prompt for Imagen 3
 */
export function buildRecipeImagePrompt(recipe: {
  title: string;
  description?: string;
  ingredients?: string[];
  category?: string;
  tags?: string[];
}): string {
  const { title, description, ingredients, category, tags } = recipe;

  // Extract key ingredients (first 3-5 most important ones)
  const keyIngredients = ingredients
    ?.slice(0, 5)
    .map(ing => {
      // Extract just the ingredient name (remove measurements)
      const match = ing.match(/(?:\d+\s*[\d\/]*\s*(?:cup|tablespoon|teaspoon|lb|oz|g|kg|ml|l|piece|clove|pinch)?s?\s+)?(.*)/i);
      return match ? match[1] : ing;
    })
    .join(', ') || '';

  // Determine cuisine style from category or tags
  let cuisineStyle = '';
  if (category) {
    cuisineStyle = category.toLowerCase();
  }
  if (tags && tags.length > 0) {
    const cuisineTag = tags.find(tag =>
      ['italian', 'mexican', 'asian', 'chinese', 'japanese', 'indian', 'french', 'mediterranean'].includes(tag.toLowerCase())
    );
    if (cuisineTag) {
      cuisineStyle = cuisineTag;
    }
  }

  // Determine presentation style based on category
  let presentationStyle = 'beautifully plated';
  if (category?.toLowerCase().includes('dessert') || category?.toLowerCase().includes('baking')) {
    presentationStyle = 'elegantly styled on a rustic wooden table';
  } else if (category?.toLowerCase().includes('breakfast')) {
    presentationStyle = 'on a bright morning table with natural light';
  } else if (category?.toLowerCase().includes('appetizer') || category?.toLowerCase().includes('snack')) {
    presentationStyle = 'artfully arranged on a serving board';
  }

  // Build the prompt with professional food photography style
  let prompt = `Professional food photography of ${title}`;

  // Add key ingredients if available
  if (keyIngredients) {
    prompt += `, featuring ${keyIngredients}`;
  }

  // Add cuisine style
  if (cuisineStyle) {
    prompt += `, ${cuisineStyle} style`;
  }

  // Add presentation details
  prompt += `, ${presentationStyle}`;

  // Add professional photography characteristics
  prompt += ', overhead view, natural lighting, shallow depth of field, restaurant quality plating, vibrant colors, appetizing presentation, high resolution, professional food styling';

  // Add context from description if available
  if (description && description.length > 0) {
    const descriptionSnippet = description.substring(0, 100).toLowerCase();
    if (descriptionSnippet.includes('crispy') || descriptionSnippet.includes('crunchy')) {
      prompt += ', showing crispy texture';
    }
    if (descriptionSnippet.includes('creamy') || descriptionSnippet.includes('smooth')) {
      prompt += ', showing creamy smooth texture';
    }
    if (descriptionSnippet.includes('golden') || descriptionSnippet.includes('caramelized')) {
      prompt += ', with golden caramelized finish';
    }
  }

  console.log('Generated prompt for image:', prompt);
  return prompt;
}

/**
 * Generates recipe cover photo using Google Imagen 3
 * @param recipe - Recipe data to generate image from
 * @param options - Image generation options
 * @returns ImageGenerationResult with base64 encoded images
 */
export async function generateRecipeImage(
  recipe: {
    title: string;
    description?: string;
    ingredients?: string[];
    category?: string;
    tags?: string[];
  },
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  try {
    if (!GEMINI_API_KEY) {
      return {
        success: false,
        error: 'Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.',
      };
    }

    if (!recipe.title || recipe.title.trim().length === 0) {
      return {
        success: false,
        error: 'Recipe title is required for image generation.',
      };
    }

    // Build optimized prompt
    const prompt = buildRecipeImagePrompt(recipe);

    // Set default options
    const {
      aspectRatio = '4:3', // Good for recipe photos
      sampleCount = 1, // Generate 1 image by default
    } = options;

    console.log('Generating image with Imagen 3...');
    console.log('Aspect ratio:', aspectRatio);
    console.log('Sample count:', sampleCount);

    // Prepare request body
    const requestBody = {
      instances: [
        {
          prompt: prompt,
        },
      ],
      parameters: {
        sampleCount: Math.min(sampleCount, 4), // Max 4 images
        aspectRatio: aspectRatio,
      },
    };

    // Call Imagen 3 API
    const response = await axios.post(
      `${IMAGEN_API_URL}?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout (image generation can take time)
      }
    );

    // Extract base64 encoded images from response
    const predictions = response.data?.predictions;
    if (!predictions || predictions.length === 0) {
      return {
        success: false,
        error: 'No images generated from Imagen API',
        prompt,
      };
    }

    // Extract base64 images
    const images: string[] = predictions.map(
      (prediction: any) => prediction.bytesBase64Encoded
    );

    console.log(`Successfully generated ${images.length} image(s)`);

    return {
      success: true,
      images,
      prompt,
    };
  } catch (error) {
    console.error('Image generation error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      if (status === 429) {
        return {
          success: false,
          error: 'API rate limit exceeded. Please try again in a moment.',
        };
      }

      if (status === 403) {
        return {
          success: false,
          error: 'API key is invalid or Imagen API is not enabled. Please check your configuration.',
        };
      }

      if (status === 400) {
        return {
          success: false,
          error: `Invalid request: ${message}. The prompt may need adjustment.`,
        };
      }

      return {
        success: false,
        error: `API error: ${message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generates recipe cover photo and uploads it to Firebase Storage
 * @param recipe - Recipe data
 * @param userId - User ID for storage organization
 * @param recipeId - Recipe ID for storage organization
 * @param options - Image generation options
 * @returns ImageGenerationResult with Firebase Storage URLs
 */
export async function generateAndUploadRecipeImage(
  recipe: {
    title: string;
    description?: string;
    ingredients?: string[];
    category?: string;
    tags?: string[];
  },
  userId: string,
  recipeId: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  try {
    // Generate images
    const generationResult = await generateRecipeImage(recipe, options);

    if (!generationResult.success || !generationResult.images) {
      return generationResult;
    }

    console.log('Uploading generated images to Firebase Storage...');

    // Upload all generated images to Firebase Storage
    const uploadPromises = generationResult.images.map((base64Image, index) => {
      const filename = index === 0 ? 'cover.jpg' : `generated-${Date.now()}-${index}.jpg`;
      return uploadBase64ImageToStorage(base64Image, userId, recipeId, filename);
    });

    const downloadURLs = await Promise.all(uploadPromises);

    console.log(`Successfully uploaded ${downloadURLs.length} image(s) to Firebase Storage`);

    return {
      success: true,
      images: generationResult.images,
      downloadURLs,
      prompt: generationResult.prompt,
    };
  } catch (error) {
    console.error('Error generating and uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during upload',
    };
  }
}

/**
 * Estimates the cost of generating images
 * @param sampleCount - Number of images to generate
 * @returns Estimated cost in USD
 */
export function estimateGenerationCost(sampleCount: number = 1): number {
  return sampleCount * IMAGEN_COST_PER_IMAGE;
}
