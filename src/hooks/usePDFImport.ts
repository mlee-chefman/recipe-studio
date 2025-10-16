import { useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { parseMultipleRecipes } from '@services/gemini.service';
import { extractTextFromPDF } from '@utils/pdfExtractor';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { IMPORT_MESSAGES, IMPORT_ERRORS, IMPORT_ALERTS } from '@constants/importMessages';

export interface UsePDFImportResult {
  selectedFile: { name: string; uri: string } | null;
  isProcessing: boolean;
  processingStep: string;
  pickPDF: () => Promise<void>;
  processAndImport: () => Promise<{ success: boolean; recipes?: ScrapedRecipe[]; error?: string }>;
  reset: () => void;
}

/**
 * Custom hook for PDF-based recipe import functionality
 * Handles PDF selection, text extraction, and recipe parsing
 */
export function usePDFImport(): UsePDFImportResult {
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  /**
   * Pick a PDF file from the device
   */
  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile({
          name: result.assets[0].name,
          uri: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert(IMPORT_ALERTS.ERROR, 'Could not open file picker. Please try again.');
    }
  };

  /**
   * Process the selected PDF and extract recipes
   */
  const processAndImport = async () => {
    if (!selectedFile) {
      Alert.alert(IMPORT_ALERTS.NO_FILE, IMPORT_ERRORS.NO_FILE);
      return { success: false, error: 'No file selected' };
    }

    setIsProcessing(true);
    setProcessingStep(IMPORT_MESSAGES.PDF.EXTRACTING);

    try {
      // Step 1: Extract text from PDF
      const textResult = await extractTextFromPDF(selectedFile.uri);

      if (!textResult.success || !textResult.text) {
        Alert.alert(
          IMPORT_ALERTS.EXTRACTION_FAILED,
          textResult.error || IMPORT_ERRORS.TEXT_EXTRACTION_FAILED
        );
        setIsProcessing(false);
        return { success: false, error: textResult.error };
      }

      // Step 2: Parse recipes from extracted text
      setProcessingStep(IMPORT_MESSAGES.PDF.PARSING);
      const parseResult = await parseMultipleRecipes(textResult.text);

      if (!parseResult.success || parseResult.recipes.length === 0) {
        Alert.alert(
          IMPORT_ALERTS.NO_RECIPES,
          parseResult.error || IMPORT_ERRORS.NO_RECIPES_FOUND
        );
        setIsProcessing(false);
        return { success: false, error: parseResult.error };
      }

      setIsProcessing(false);
      return { success: true, recipes: parseResult.recipes };
    } catch (error) {
      console.error('PDF import error:', error);
      Alert.alert(IMPORT_ALERTS.ERROR, IMPORT_ERRORS.UNEXPECTED_ERROR);
      setIsProcessing(false);
      return { success: false, error: 'Unexpected error occurred' };
    }
  };

  /**
   * Reset all state
   */
  const reset = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProcessingStep('');
  };

  return {
    selectedFile,
    isProcessing,
    processingStep,
    pickPDF,
    processAndImport,
    reset,
  };
}
