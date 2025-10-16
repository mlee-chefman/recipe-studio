import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { generateRecipeFromDescription } from '@services/gemini.service';
import { checkUsageLimit, recordGeneration, getRemainingGenerations } from '@utils/aiUsageTracker';
import { ScrapedRecipe } from '@utils/recipeScraper';

export interface AIGenerationResult {
  success: boolean;
  recipe?: ScrapedRecipe;
  error?: string;
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
  onRecipeGenerated?: (recipe: ScrapedRecipe) => void;
  /**
   * Whether to automatically load remaining generations on mount
   */
  autoLoadGenerations?: boolean;
}

export function useAIRecipeGenerator(options: UseAIRecipeGeneratorOptions = {}) {
  const {
    onRecipeGenerated,
    autoLoadGenerations = true,
  } = options;

  // State
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState<RemainingGenerations | null>(null);

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

      // Clear description after successful generation
      setAiDescription('');

      // Call the callback if provided
      if (onRecipeGenerated) {
        onRecipeGenerated(generatedRecipe);
      }

      Alert.alert('Success', 'Recipe generated! Review and edit as needed.');

      setIsGenerating(false);
      return { success: true, recipe: generatedRecipe };
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
    isGenerating,
    remainingGenerations,

    // Setters
    setAiDescription,

    // Functions
    generateRecipe,
    loadRemainingGenerations,
    resetDescription,
  };
}
