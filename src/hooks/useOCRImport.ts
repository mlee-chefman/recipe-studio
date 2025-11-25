import { useState } from 'react';
import { Alert } from 'react-native';
import { parseRecipeFromImage } from '@services/gemini.service';
import { useAICoverGeneration } from './useAICoverGeneration';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { parseRecipeFromText } from '@utils/helpers/recipeParser';
import { haptics } from '@utils/haptics';

export interface UseOCRImportOptions {
  generateAICover?: boolean; // Whether to generate AI cover image instead of using scanned photo
}

export interface UseOCRImportResult {
  imageUri: string | null;
  imageUris: string[];
  parsedRecipe: ScrapedRecipe | null;
  isProcessing: boolean;
  processingStep: string;
  processImage: (uri: string | string[], options?: UseOCRImportOptions) => Promise<ScrapedRecipe | null>;
  reset: () => void;
}

/**
 * Custom hook for OCR recipe import functionality
 * Handles image processing, text extraction, and recipe parsing
 */
export function useOCRImport(): UseOCRImportResult {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [parsedRecipe, setParsedRecipe] = useState<ScrapedRecipe | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  const { generateAndUploadCover } = useAICoverGeneration();

  /**
   * Process one or more images: extract recipe directly with Gemini multimodal vision
   * Optionally generates AI cover image instead of using scanned photo
   * Falls back to local parser if Gemini fails
   * Returns the parsed recipe for auto-navigation
   */
  const processImage = async (uri: string | string[], options: UseOCRImportOptions = {}): Promise<ScrapedRecipe | null> => {
    const { generateAICover = false } = options;

    setIsProcessing(true);
    const uris = Array.isArray(uri) ? uri : [uri];
    setProcessingStep(`Analyzing ${uris.length > 1 ? `${uris.length} recipe images` : 'recipe image'} with AI...`);

    try {
      setImageUri(uris[0]); // Keep first image for backwards compatibility
      setImageUris(uris);

      // Step 1: Try Gemini multimodal vision (direct image(s) → recipe)
      const parseResult = await parseRecipeFromImage(uri);

      if (parseResult.success && parseResult.recipe) {
        const recipe = parseResult.recipe;

        // Step 2: Optionally generate AI cover image
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

        setParsedRecipe(recipe);
        return recipe; // Return recipe for auto-navigation
      }

      // Step 3: Gemini failed - use fallback local parser
      console.warn('Gemini multimodal vision failed:', parseResult.error);
      console.log('Using fallback local parser instead...');

      setProcessingStep('Using offline recipe parser...');

      // Show alert to inform user
      haptics.warning();
      Alert.alert(
        'AI Processing Unavailable',
        'Could not analyze recipe with AI. Using basic offline parser instead. You can edit the recipe after importing if needed.',
        [{ text: 'OK' }]
      );

      // Use fallback regex-based parser
      const fallbackRecipe = parseRecipeFromText('', uri); // Empty text since we don't have OCR
      setParsedRecipe(fallbackRecipe);
      return fallbackRecipe; // Return recipe for auto-navigation

    } catch (error) {
      console.error('Processing Error:', error);
      haptics.error();
      Alert.alert(
        'Processing Failed',
        'Could not process the image. Please try again with a different image.'
      );
      setImageUri(null);
      return null;
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
    setImageUris([]);
    setParsedRecipe(null);
    setIsProcessing(false);
    setProcessingStep('');
  };

  return {
    imageUri,
    imageUris,
    parsedRecipe,
    isProcessing,
    processingStep,
    processImage,
    reset,
  };
}
