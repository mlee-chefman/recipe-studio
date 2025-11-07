// Custom hook for loading ingredient images with progressive loading
// Handles state management and progressive updates

import { useState, useEffect, useCallback } from 'react';
import { getIngredientImagesProgressive } from '../utils/ingredientImageCache';

interface UseIngredientImagesResult {
  images: Map<string, string>;
  loading: boolean;
  loadedCount: number;
  totalCount: number;
  error: string | null;
}

/**
 * Hook to progressively load ingredient images
 *
 * @param ingredients - Array of ingredient strings (e.g., "2 cups flour")
 * @param enabled - Whether to enable loading (default: true)
 * @param batchSize - Number of images to load at once (default: 3)
 * @param delayMs - Delay between batches (default: 2000ms)
 *
 * @example
 * const { images, loading, loadedCount, totalCount } = useIngredientImages(recipe.ingredients);
 */
export function useIngredientImages(
  ingredients: string[],
  enabled: boolean = true,
  batchSize: number = 5,
  delayMs: number = 1000
): UseIngredientImagesResult {
  const [images, setImages] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const totalCount = ingredients.length;

  const loadImages = useCallback(async () => {
    if (!enabled || ingredients.length === 0) {
      return;
    }

    console.log(`🎨 Starting to load images for ${ingredients.length} ingredients...`);
    setLoading(true);
    setError(null);
    setImages(new Map());
    setLoadedCount(0);

    try {
      const finalImages = await getIngredientImagesProgressive(
        ingredients,
        (progressImages) => {
          // Update state when all images are loaded
          setImages(new Map(progressImages));
          setLoadedCount(progressImages.size);
        }
      );

      setLoading(false);
      console.log(`✅ Finished loading images: ${finalImages.size}/${ingredients.length} successful`);

      // Log which ingredients didn't get images
      if (finalImages.size < ingredients.length) {
        const missingImages = ingredients.filter(ing => !finalImages.has(ing));
        console.log(`⚠️ Ingredients without images:`, missingImages);
      }
    } catch (err) {
      console.error('❌ Error loading ingredient images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
      setLoading(false);
    }
  }, [ingredients, enabled]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  return {
    images,
    loading,
    loadedCount,
    totalCount,
    error,
  };
}
