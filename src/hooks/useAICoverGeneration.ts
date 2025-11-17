import { useState } from 'react';
import { generateRecipeImage } from '@services/imageGeneration.service';
import { uploadBase64ImageToStorage } from '@utils/imageUpload';
import { getAuth } from 'firebase/auth';
import { checkImageUsageLimit, recordImageGeneration } from '@utils/aiUsageTracker';

export interface AICoverOptions {
  title: string;
  description?: string;
  ingredients?: string[];
  category?: string;
  tags?: string[];
}

export interface UseAICoverGenerationResult {
  isGenerating: boolean;
  generationStep: string;
  generateAndUploadCover: (recipe: AICoverOptions) => Promise<string | null>;
}

/**
 * Shared hook for AI cover image generation
 * Generates AI cover image using Imagen 4 and uploads to Firebase Storage
 * Returns download URL for use in recipe
 */
export function useAICoverGeneration(): UseAICoverGenerationResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  /**
   * Generate AI cover image and upload to Firebase Storage
   * @param recipe - Recipe data for image generation
   * @returns Firebase Storage download URL or null if failed
   */
  const generateAndUploadCover = async (recipe: AICoverOptions): Promise<string | null> => {
    setIsGenerating(true);
    setGenerationStep('Checking usage limits...');

    try {
      // Check usage limits first - silently skip if quota exceeded
      const usageCheck = await checkImageUsageLimit();
      if (!usageCheck.allowed) {
        console.log('AI cover generation skipped: Usage limit reached');
        setIsGenerating(false);
        setGenerationStep('');
        return null; // Silently return null - no error shown to user
      }

      console.log('Generating AI cover for recipe:', recipe.title);
      setGenerationStep('Generating professional cover photo...');

      // Generate image with Imagen (with automatic fallback)
      const imageResult = await generateRecipeImage(
        {
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          category: recipe.category,
          tags: recipe.tags,
        },
        {
          aspectRatio: '4:3', // Good for recipe cards
          sampleCount: 1,
        }
      );

      if (!imageResult.success || !imageResult.images || imageResult.images.length === 0) {
        console.warn('AI cover generation failed:', imageResult.error);
        setIsGenerating(false);
        setGenerationStep('');
        return null;
      }

      // Log which model was successfully used
      if (imageResult.modelUsed) {
        console.log(`✅ Generated cover using ${imageResult.modelUsed}`);
      }

      // Upload to Firebase Storage to avoid Firestore size limits
      setGenerationStep('Uploading cover photo...');

      const auth = getAuth();
      const userId = auth.currentUser?.uid || 'anonymous';
      const tempRecipeId = `temp-${Date.now()}`; // Temporary ID for upload

      console.log('Uploading AI-generated image to Firebase Storage...');
      const downloadURL = await uploadBase64ImageToStorage(
        imageResult.images[0],
        userId,
        tempRecipeId,
        'ai-cover.jpg'
      );

      console.log('AI cover image uploaded successfully:', downloadURL);

      // Record usage after successful generation
      await recordImageGeneration();

      setIsGenerating(false);
      setGenerationStep('');
      return downloadURL;

    } catch (error) {
      console.error('Error generating/uploading AI cover:', error);
      setIsGenerating(false);
      setGenerationStep('');
      return null;
    }
  };

  return {
    isGenerating,
    generationStep,
    generateAndUploadCover,
  };
}
