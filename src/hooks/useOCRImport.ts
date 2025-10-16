import { useState } from 'react';
import { Alert } from 'react-native';
import { recognizeText } from '~/services/googleVision.service';
import { parseRecipeWithGemini } from '~/services/gemini.service';
import { ScrapedRecipe } from '~/utils/recipeScraper';
import { parseRecipeFromText } from '~/utils/helpers/recipeParser';

export interface UseOCRImportResult {
  imageUri: string | null;
  extractedText: string;
  parsedRecipe: ScrapedRecipe | null;
  isProcessing: boolean;
  processingStep: string;
  processImage: (uri: string) => Promise<void>;
  setExtractedText: (text: string) => void;
  reset: () => void;
}

/**
 * Custom hook for OCR recipe import functionality
 * Handles image processing, text extraction, and recipe parsing
 */
export function useOCRImport(): UseOCRImportResult {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [parsedRecipe, setParsedRecipe] = useState<ScrapedRecipe | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  /**
   * Process an image: extract text with OCR and parse recipe with AI
   */
  const processImage = async (uri: string) => {
    setIsProcessing(true);
    setProcessingStep('Extracting text from image...');

    try {
      // Step 1: Extract text with OCR
      const ocrResult = await recognizeText(uri);

      if (!ocrResult.success) {
        Alert.alert(
          'Text Recognition Failed',
          ocrResult.error || 'Could not extract text from the image. Please try again.'
        );
        setImageUri(null);
        return;
      }

      const text = ocrResult.text;

      if (!text || text.trim().length === 0) {
        Alert.alert(
          'No Text Found',
          'Could not detect any text in the image. Please try with a clearer image.'
        );
        setImageUri(null);
        return;
      }

      setExtractedText(text);
      setImageUri(uri);

      // Step 2: Parse recipe with Gemini AI
      setProcessingStep('Organizing recipe with AI...');
      const parseResult = await parseRecipeWithGemini(text, uri);

      if (!parseResult.success) {
        // If Gemini parsing fails, use fallback parser
        console.warn('Gemini parsing failed:', parseResult.error);
        console.log('Using fallback parser instead...');

        // Show alert only once to inform user
        Alert.alert(
          'AI Parsing Unavailable',
          'Could not parse recipe with AI. Using basic parsing instead. You can edit the recipe after importing if needed.',
          [{ text: 'OK' }]
        );

        // Use fallback parser
        const fallbackRecipe = parseRecipeFromText(text, uri);
        setParsedRecipe(fallbackRecipe);
        return;
      }

      if (parseResult.recipe) {
        setParsedRecipe(parseResult.recipe);
      }

    } catch (error) {
      console.error('Processing Error:', error);
      Alert.alert(
        'Processing Failed',
        'Could not process the image. Please try again with a different image.'
      );
      setImageUri(null);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  /**
   * Reset all state
   */
  const reset = () => {
    setImageUri(null);
    setExtractedText('');
    setParsedRecipe(null);
    setIsProcessing(false);
    setProcessingStep('');
  };

  return {
    imageUri,
    extractedText,
    parsedRecipe,
    isProcessing,
    processingStep,
    processImage,
    setExtractedText,
    reset,
  };
}
