import { useState } from 'react';
import { Alert, Clipboard } from 'react-native';
import { parseMultipleRecipes } from '@services/gemini.service';
import { ScrapedRecipe } from '@utils/recipeScraper';

export interface UseTextImportResult {
  importText: string;
  setImportText: (text: string) => void;
  isProcessing: boolean;
  pasteFromClipboard: () => Promise<void>;
  parseAndImport: () => Promise<{ success: boolean; recipes?: ScrapedRecipe[]; error?: string }>;
  reset: () => void;
}

/**
 * Custom hook for text-based recipe import functionality
 * Handles text input, clipboard operations, and recipe parsing
 */
export function useTextImport(): UseTextImportResult {
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Paste text from clipboard
   */
  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getString();
      if (text && text.trim()) {
        setImportText(text);
      } else {
        Alert.alert('No Text', 'Clipboard is empty or contains no text.');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Error', 'Could not read from clipboard.');
    }
  };

  /**
   * Parse the import text and extract recipes
   */
  const parseAndImport = async () => {
    if (!importText.trim()) {
      Alert.alert('No Text', 'Please paste or enter recipe text first.');
      return { success: false, error: 'No text provided' };
    }

    setIsProcessing(true);

    try {
      const result = await parseMultipleRecipes(importText);

      if (!result.success || result.recipes.length === 0) {
        Alert.alert(
          'Import Failed',
          result.error || 'Could not find any recipes in the text. Please make sure the text contains recipe information.'
        );
        setIsProcessing(false);
        return { success: false, error: result.error };
      }

      setIsProcessing(false);
      return { success: true, recipes: result.recipes };
    } catch (error) {
      console.error('Text import error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsProcessing(false);
      return { success: false, error: 'Unexpected error occurred' };
    }
  };

  /**
   * Reset all state
   */
  const reset = () => {
    setImportText('');
    setIsProcessing(false);
  };

  return {
    importText,
    setImportText,
    isProcessing,
    pasteFromClipboard,
    parseAndImport,
    reset,
  };
}
