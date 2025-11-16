import { useState } from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { parseMultipleRecipes } from '@services/gemini.service';
import { useAICoverGeneration } from './useAICoverGeneration';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { haptics } from '@utils/haptics';

export interface UseTextImportOptions {
  generateAICover?: boolean; // Whether to generate AI cover image
}

export interface UseTextImportResult {
  importText: string;
  setImportText: (text: string) => void;
  isProcessing: boolean;
  processingStep: string;
  pasteFromClipboard: () => Promise<void>;
  parseAndImport: (options?: UseTextImportOptions) => Promise<ScrapedRecipe | null>;
  reset: () => void;
}

/**
 * Custom hook for text-based recipe import functionality
 * Handles text input, clipboard operations, and recipe parsing
 */
export function useTextImport(): UseTextImportResult {
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  const { generateAndUploadCover } = useAICoverGeneration();

  /**
   * Paste text from clipboard
   */
  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim()) {
        haptics.light();
        setImportText(text);
      } else {
        haptics.warning();
        Alert.alert('No Text', 'Clipboard is empty or contains no text.');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      haptics.error();
      Alert.alert('Error', 'Could not read from clipboard.');
    }
  };

  /**
   * Parse the import text and extract recipe
   * Optionally generates AI cover image
   * Returns single recipe for auto-navigation to RecipeCreator
   */
  const parseAndImport = async (options: UseTextImportOptions = {}): Promise<ScrapedRecipe | null> => {
    const { generateAICover = false } = options;

    if (!importText.trim()) {
      haptics.warning();
      Alert.alert('No Text', 'Please paste or enter recipe text first.');
      return null;
    }

    setIsProcessing(true);
    setProcessingStep('Analyzing recipe text with AI...');

    try {
      // Parse text - only expect single recipe
      const result = await parseMultipleRecipes(importText);

      if (!result.success || result.recipes.length === 0) {
        haptics.error();
        Alert.alert(
          'Import Failed',
          result.error || 'Could not find a recipe in the text. Please make sure the text contains recipe information.'
        );
        setIsProcessing(false);
        setProcessingStep('');
        return null;
      }

      // Use first recipe (simplified for single recipe import)
      const recipe = result.recipes[0];

      // Generate AI cover if requested
      if (generateAICover) {
        setProcessingStep('Generating professional cover photo...');

        const downloadURL = await generateAndUploadCover({
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          category: recipe.category,
          tags: recipe.tags,
        });

        if (downloadURL) {
          recipe.image = downloadURL;
          console.log('AI cover image set successfully');
        } else {
          console.log('AI cover generation skipped (quota exceeded or failed), continuing without image');
          // Continue without AI cover - quota may be exceeded
        }
      }

      setIsProcessing(false);
      setProcessingStep('');
      return recipe;
    } catch (error) {
      console.error('Text import error:', error);
      haptics.error();
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsProcessing(false);
      setProcessingStep('');
      return null;
    }
  };

  /**
   * Reset all state
   */
  const reset = () => {
    setImportText('');
    setIsProcessing(false);
    setProcessingStep('');
  };

  return {
    importText,
    setImportText,
    isProcessing,
    processingStep,
    pasteFromClipboard,
    parseAndImport,
    reset,
  };
}
