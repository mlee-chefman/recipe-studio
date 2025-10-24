import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { generateRecipeFromDescription } from '@services/gemini.service';
import { checkUsageLimit, recordGeneration, getRemainingGenerations } from '@utils/aiUsageTracker';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { useAutoImageGeneration } from './useAutoImageGeneration';

export interface AIGenerationResult {
  success: boolean;
  recipe?: ScrapedRecipe;
  error?: string;
  imageUrl?: string; // Added to return generated image URL
}

export interface RemainingGenerations {
  daily: number;
  monthly: number;
  dailyLimit: number;
  monthlyLimit: number;
}

export interface UseAIRecipeGeneratorOptions {
  /**
   * Callback when a recipe is successfully generated
   */
  onRecipeGenerated?: (recipe: ScrapedRecipe, imageUrl?: string) => void;
  /**
   * Whether to automatically load remaining generations on mount
   */
  autoLoadGenerations?: boolean;
  /**
   * User ID for auto-generating cover images
   */
  userId?: string;
  /**
   * Recipe ID (or temp ID) for auto-generating cover images
   */
  recipeId?: string;
  /**
   * Whether to auto-generate cover images (default: true)
   */
  autoGenerateImage?: boolean;
}

export function useAIRecipeGenerator(options: UseAIRecipeGeneratorOptions = {}) {
  const {
    onRecipeGenerated,
    autoLoadGenerations = true,
    userId,
    recipeId,
    autoGenerateImage = true,
  } = options;

  // State
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState<RemainingGenerations | null>(null);

  // Auto image generation hook
  const {
    isGenerating: isGeneratingImage,
    progress: imageProgress,
    generateImageForRecipe,
  } = useAutoImageGeneration();

  /**
   * Load remaining AI generations from usage tracker
   */
  const loadRemainingGenerations = async () => {
    try {
      const remaining = await getRemainingGenerations();
      setRemainingGenerations(remaining);
    } catch (error) {
      console.error('Error loading remaining generations:', error);
    }
  };

  /**
   * Generate a recipe from an AI description
   */
  const generateRecipe = async (): Promise<AIGenerationResult> => {
    if (!aiDescription.trim()) {
      Alert.alert('Missing Information', 'Please describe what you want to cook.');
      return { success: false, error: 'No description provided' };
    }

    // Check usage limits before generating
    const usageCheck = await checkUsageLimit();
    if (!usageCheck.allowed) {
      Alert.alert('Generation Limit Reached', usageCheck.message || 'Please try again later.');
      return { success: false, error: 'Usage limit reached' };
    }

    setIsGenerating(true);

    try {
      const result = await generateRecipeFromDescription(aiDescription);

      if (!result.success || !result.recipe) {
        Alert.alert('Generation Failed', result.error || 'Could not generate recipe. Please try again.');
        setIsGenerating(false);
        return { success: false, error: result.error };
      }

      const generatedRecipe = result.recipe;

      // Record successful generation
      await recordGeneration();

      // Update remaining generations display
      await loadRemainingGenerations();

      // Auto-generate cover image if enabled
      let generatedImageUrl: string | undefined;
      if (autoGenerateImage && userId && recipeId) {
        console.log('Auto-generating cover image for AI-generated recipe...');

        const imageResult = await generateImageForRecipe({
          userId,
          recipeId,
          recipeData: {
            title: generatedRecipe.title,
            description: generatedRecipe.description,
            ingredients: generatedRecipe.ingredients,
            category: generatedRecipe.category,
            tags: generatedRecipe.tags,
          },
          silent: true,
        });

        if (imageResult.success && imageResult.imageUrl) {
          generatedImageUrl = imageResult.imageUrl;
          console.log('Cover image auto-generated:', generatedImageUrl);
        } else if (!imageResult.skipped) {
          console.warn('Cover image generation failed:', imageResult.error);
        }
      }

      // Clear description after successful generation
      setAiDescription('');

      // Call the callback if provided
      if (onRecipeGenerated) {
        onRecipeGenerated(generatedRecipe, generatedImageUrl);
      }

      const successMessage = generatedImageUrl
        ? 'Recipe and cover photo generated! Review and edit as needed.'
        : 'Recipe generated! Review and edit as needed.';
      Alert.alert('Success', successMessage);

      setIsGenerating(false);
      return { success: true, recipe: generatedRecipe, imageUrl: generatedImageUrl };
    } catch (error) {
      console.error('Recipe generation error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsGenerating(false);
      return { success: false, error: 'Unexpected error occurred' };
    }
  };

  /**
   * Reset the AI description
   */
  const resetDescription = () => {
    setAiDescription('');
  };

  // Auto-load remaining generations on mount if enabled
  useEffect(() => {
    if (autoLoadGenerations) {
      loadRemainingGenerations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return {
    // State
    aiDescription,
    isGenerating: isGenerating || isGeneratingImage,
    remainingGenerations,
    imageProgress, // Expose image generation progress

    // Setters
    setAiDescription,

    // Functions
    generateRecipe,
    loadRemainingGenerations,
    resetDescription,
  };
}
