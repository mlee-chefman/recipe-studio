import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { scrapeRecipe } from '@utils/recipeScraper';
import { isExcludedUrl } from '@utils/helpers/urlHelpers';

interface RecipeDetails {
  title: string | null;
  hasIngredients: boolean;
  hasInstructions: boolean;
}

interface RecipeDetectionData {
  type: string;
  hasRecipe: boolean;
  recipeDetails?: RecipeDetails;
  url: string;
}

interface UseWebViewImportParams {
  onImportSuccess: (scrapedRecipe: any) => void;
}

export function useWebViewImport({ onImportSuccess }: UseWebViewImportParams) {
  const [isImportable, setIsImportable] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Handle messages from WebView (recipe detection results)
   */
  const handleMessage = useCallback((event: any) => {
    try {
      const data: RecipeDetectionData = JSON.parse(event.nativeEvent.data);

      if (data.type === 'recipeDetection') {
        // Only mark as importable if we actually found Recipe structured data
        // and the URL is not excluded
        const shouldBeImportable = data.hasRecipe && !isExcludedUrl(data.url);

        setIsImportable(shouldBeImportable);

        // Log for debugging
        if (data.hasRecipe && data.recipeDetails) {
          console.log('Recipe detected:', {
            url: data.url,
            title: data.recipeDetails.title,
            hasIngredients: data.recipeDetails.hasIngredients,
            hasInstructions: data.recipeDetails.hasInstructions,
          });
        }
      }
    } catch (e) {
      // Ignore non-JSON messages
      console.log('Error parsing WebView message:', e);
    }
  }, []);

  /**
   * Handle recipe import
   */
  const handleImport = useCallback(async (currentUrl: string) => {
    if (!currentUrl || !isImportable) return;

    setIsImporting(true);

    try {
      const scrapedRecipe = await scrapeRecipe(currentUrl);
      onImportSuccess(scrapedRecipe);
    } catch (error) {
      Alert.alert(
        'Import Failed',
        'Could not import recipe from this page. Please try a different recipe or enter it manually.',
        [{ text: 'OK' }]
      );
      setIsImporting(false);
    }
  }, [isImportable, onImportSuccess]);

  /**
   * Reset importable state (e.g., when navigating)
   */
  const resetImportable = useCallback(() => {
    setIsImportable(false);
  }, []);

  return {
    isImportable,
    isImporting,
    handleMessage,
    handleImport,
    resetImportable,
  };
}
