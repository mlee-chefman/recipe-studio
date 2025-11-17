import axios from 'axios';
import { Recipe, Step } from '../types/recipe';
import { uploadBase64ImageToStorage } from '../utils/imageUpload';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Imagen model configurations with fallback support
// Standard: 70/day quota, Fast: 70/day quota, Ultra: 30/day quota = 170 images/day total for tier 1 users
const IMAGEN_MODELS = [
  {
    name: 'imagen-4.0-generate-001',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict',
    cost: 0.04,
    label: 'Imagen 4.0 Standard',
  },
  {
    name: 'imagen-4.0-fast-generate-001',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict',
    cost: 0.02,
    label: 'Imagen 4.0 Fast',
  },
  {
    name: 'imagen-4.0-ultra-generate-001',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict',
    cost: 0.06,
    label: 'Imagen 4.0 Ultra',
  },
];
export const IMAGEN_COST_PER_IMAGE = 0.04;

/**
 * Available aspect ratios for Imagen 4
 */
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

/**
 * Options for image generation
 */
export interface ImageGenerationOptions {
  aspectRatio?: AspectRatio;
  sampleCount?: number; // Note: Imagen 4 generates 1 image per call (parameter kept for API compatibility)
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
  modelUsed?: string; // Which Imagen model was successfully used (Standard, Fast, or Ultra)
}

/**
 * Visual style variations for diverse image generation
 */
const CAMERA_ANGLES = [
  'overhead view',
  '45-degree angle view',
  'side view',
  'close-up shot',
  'three-quarter view',
  'eye-level perspective',
  'slightly elevated angle',
];

const LIGHTING_STYLES = [
  'natural lighting',
  'warm golden hour lighting',
  'bright daylight',
  'soft diffused lighting',
  'dramatic side lighting',
  'backlighting with rim light',
  'warm ambient lighting',
  'morning sunlight',
];

const DEPTH_STYLES = [
  'shallow depth of field',
  'soft bokeh background',
  'sharp focus with blurred background',
  'cinematic depth',
  'macro photography detail',
  'selective focus',
];

const PLATING_STYLES = [
  'restaurant quality plating',
  'rustic homestyle presentation',
  'modern minimalist plating',
  'elegant fine dining presentation',
  'casual family-style serving',
  'artisanal plating',
  'contemporary styled presentation',
];

const BACKGROUND_SETTINGS = [
  'on a wooden table',
  'on a marble countertop',
  'on a rustic serving board',
  'on a clean white surface',
  'on a dark slate plate',
  'with kitchen ambiance in background',
  'on a colorful ceramic plate',
  'on a vintage table setting',
];

const COLOR_MOODS = [
  'vibrant colors',
  'rich saturated colors',
  'warm color palette',
  'fresh bright colors',
  'natural earthy tones',
  'bold vibrant hues',
  'soft pastel tones',
  'deep rich colors',
];

/**
 * Randomly selects an item from an array
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Builds a detailed, optimized prompt for food photography based on recipe data
 * Uses randomized visual styles to create diverse, non-uniform images
 * @param recipe - Recipe object containing title, description, ingredients, etc.
 * @returns Optimized prompt for Imagen 4
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

  // Add randomized professional photography characteristics for variety
  const cameraAngle = randomChoice(CAMERA_ANGLES);
  const lightingStyle = randomChoice(LIGHTING_STYLES);
  const depthStyle = randomChoice(DEPTH_STYLES);
  const platingStyle = randomChoice(PLATING_STYLES);
  const backgroundSetting = randomChoice(BACKGROUND_SETTINGS);
  const colorMood = randomChoice(COLOR_MOODS);

  prompt += `, ${cameraAngle}, ${lightingStyle}, ${depthStyle}, ${platingStyle}, ${backgroundSetting}, ${colorMood}, appetizing presentation, high resolution, professional food styling`;

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
 * Generates recipe cover photo using Imagen with automatic fallback
 * Tries models in order: 4.0 Standard (70/day) → 4.0 Fast (70/day) → 4.0 Ultra (30/day)
 * Total capacity: 170 images per day across all models
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

  console.log('Starting image generation with automatic fallback...');
  console.log('Aspect ratio:', aspectRatio);
  console.log('Sample count:', sampleCount);

  // Try each model in sequence until one succeeds
  let lastError: string | undefined;

  for (let i = 0; i < IMAGEN_MODELS.length; i++) {
    const model = IMAGEN_MODELS[i];

    try {
      console.log(`Trying model ${i + 1}/${IMAGEN_MODELS.length}: ${model.label}...`);

      // Prepare request body for Imagen API
      const requestBody = {
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: Math.min(sampleCount, 4), // Max 4 images
          aspectRatio: aspectRatio,
          imageSize: '1K', // Options: '1K' or '2K' (2K only for standard/ultra)
        },
      };

      // Call Imagen API with current model
      const response = await axios.post(
        `${model.url}?key=${GEMINI_API_KEY}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout (image generation can take time)
        }
      );

      // Extract base64 encoded images from Imagen response
      const predictions = response.data?.predictions;
      if (!predictions || predictions.length === 0) {
        lastError = `No images generated from ${model.label}`;
        console.log(`${model.label} returned no predictions, trying next model...`);
        continue;
      }

      // Extract base64 images from Imagen response format
      // Imagen uses predictions[].bytesBase64Encoded or predictions[].image.bytesBase64Encoded
      const images: string[] = predictions.map((prediction: any) => {
        // Try different possible response formats
        return prediction.bytesBase64Encoded || prediction.image?.bytesBase64Encoded;
      }).filter((img: any) => img); // Remove any undefined values

      if (images.length === 0) {
        lastError = `No images found in ${model.label} response`;
        console.log(`${model.label} returned empty images, trying next model...`);
        continue;
      }

      console.log(`✅ Successfully generated ${images.length} image(s) using ${model.label}`);

      return {
        success: true,
        images,
        prompt,
        modelUsed: model.label,
      };

    } catch (error) {
      console.error(`${model.label} error:`, error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;

        // Check if it's a quota/rate limit error - try next model
        if (status === 429 || (status === 400 && message?.toLowerCase().includes('quota'))) {
          console.log(`${model.label} quota exceeded (${status}), trying next model...`);
          lastError = `${model.label}: Quota exceeded`;
          continue;
        }

        // For non-quota errors on first model, still try fallbacks
        // (could be temporary issues)
        if (i < IMAGEN_MODELS.length - 1) {
          console.log(`${model.label} failed (${status}), trying next model...`);
          lastError = `${model.label}: ${message}`;
          continue;
        }

        // On last model, return specific error
        if (status === 403) {
          return {
            success: false,
            error: 'API key is invalid or Imagen API is not enabled. Please check your configuration.',
          };
        }

        lastError = `API error: ${message}`;
      } else {
        lastError = error instanceof Error ? error.message : 'Unknown error occurred';
      }

      // Try next model if available
      if (i < IMAGEN_MODELS.length - 1) {
        continue;
      }
    }
  }

  // All models failed
  return {
    success: false,
    error: lastError || 'All image generation models failed. Please try again later.',
    prompt,
  };
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
      modelUsed: generationResult.modelUsed,
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
