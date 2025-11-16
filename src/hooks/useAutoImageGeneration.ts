import { useState } from 'react';
import { generateAndUploadRecipeImage } from '../services/imageGeneration.service';
import { checkImageUsageLimit, recordImageGeneration } from '../utils/aiUsageTracker';

export interface AutoImageGenerationOptions {
  /**
   * User ID for Firebase Storage organization
   */
  userId: string;
  /**
   * Recipe ID (or temp ID for new recipes)
   */
  recipeId: string;
  /**
   * Recipe data for prompt generation
   */
  recipeData: {
    title: string;
    description?: string;
    ingredients?: string[];
    category?: string;
    tags?: string[];
  };
  /**
   * Whether to show notifications/alerts
   */
  silent?: boolean;
}

export interface AutoImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  skipped?: boolean; // True if generation was skipped due to limits or other reasons
}

/**
 * Hook for automatic image generation during recipe creation/import flows
 * Used for: AI Assistant, My Fridge, PDF Import, OCR Import
 */
export function useAutoImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');

  /**
   * Automatically generate an image for a recipe
   * Checks usage limits, generates image, uploads to Firebase
   * Returns the image URL or null if failed/skipped
   */
  const generateImageForRecipe = async (
    options: AutoImageGenerationOptions
  ): Promise<AutoImageGenerationResult> => {
    const { userId, recipeId, recipeData, silent = false } = options;

    // Validate inputs
    if (!userId || !recipeId) {
      console.warn('Auto-image generation: Missing userId or recipeId');
      return { success: false, skipped: true, error: 'Missing user or recipe ID' };
    }

    if (!recipeData.title || recipeData.title.trim().length === 0) {
      console.warn('Auto-image generation: Missing recipe title');
      return { success: false, skipped: true, error: 'Missing recipe title' };
    }

    setIsGenerating(true);
    setProgress('Checking usage limits...');

    try {
      // Check usage limits
      const usageCheck = await checkImageUsageLimit();
      if (!usageCheck.allowed) {
        console.log('Auto-image generation: Usage limit reached, skipping');
        setIsGenerating(false);
        setProgress('');
        return {
          success: false,
          skipped: true,
          error: usageCheck.message || 'Usage limit reached',
        };
      }

      console.log(`Auto-generating image for recipe: ${recipeData.title}`);
      setProgress(`Generating cover photo for "${recipeData.title}"...`);

      // Generate and upload image
      const result = await generateAndUploadRecipeImage(
        recipeData,
        userId,
        recipeId,
        { aspectRatio: '4:3', sampleCount: 1 }
      );

      if (result.success && result.downloadURLs && result.downloadURLs.length > 0) {
        const imageUrl = result.downloadURLs[0];
        console.log(`Auto-image generation successful: ${imageUrl}`);

        // Record usage
        await recordImageGeneration();

        setProgress('Cover photo generated!');
        setIsGenerating(false);

        return {
          success: true,
          imageUrl,
        };
      } else {
        console.error('Auto-image generation failed:', result.error);
        setProgress('');
        setIsGenerating(false);

        return {
          success: false,
          error: result.error || 'Failed to generate image',
        };
      }
    } catch (error) {
      console.error('Auto-image generation error:', error);
      setProgress('');
      setIsGenerating(false);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  /**
   * Generate images for multiple recipes (e.g., PDF import with multiple recipes)
   * Respects usage limits and stops when limit is reached
   */
  const generateImagesForMultipleRecipes = async (
    recipes: Array<{
      recipeId: string;
      recipeData: {
        title: string;
        description?: string;
        ingredients?: string[];
        category?: string;
        tags?: string[];
      };
    }>,
    userId: string
  ): Promise<Map<string, string>> => {
    const imageMap = new Map<string, string>(); // recipeId -> imageUrl
    setIsGenerating(true);

    for (let i = 0; i < recipes.length; i++) {
      const { recipeId, recipeData } = recipes[i];

      setProgress(`Generating image ${i + 1}/${recipes.length}: ${recipeData.title}...`);

      const result = await generateImageForRecipe({
        userId,
        recipeId,
        recipeData,
        silent: true,
      });

      if (result.success && result.imageUrl) {
        imageMap.set(recipeId, result.imageUrl);
      } else if (result.skipped) {
        console.log(`Skipping remaining images due to: ${result.error}`);
        break; // Stop generating if we hit usage limits
      }

      // Small delay between generations to avoid overwhelming the API
      if (i < recipes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsGenerating(false);
    setProgress('');

    return imageMap;
  };

  return {
    isGenerating,
    progress,
    generateImageForRecipe,
    generateImagesForMultipleRecipes,
  };
}
