import { useState, useCallback } from 'react';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { MatchedRecipe, getTopMatchedRecipes } from '~/utils/ingredientMatcher';
import { generateMultipleRecipesFromIngredients } from '~/services/gemini.service';
import { FridgeIngredient } from '~/types/ingredient';
import { Recipe } from '~/types/recipe';
import { RECIPES_PER_GENERATION } from '@constants/myFridgeConstants';
import { useAutoImageGeneration } from './useAutoImageGeneration';
import * as Crypto from 'expo-crypto';

interface RecipeGenerationOptions {
  dietary?: string;
  cuisine?: string;
  cookingTime?: string;
  category?: string;
  matchingStrictness?: 'exact' | 'substitutions' | 'creative';
  excludeTitles?: string[]; // Titles to exclude (avoid duplicates)
}

interface ExtendedScrapedRecipe extends ScrapedRecipe {
  missingIngredients?: string[];
  substitutions?: Array<{ missing: string; substitutes: string[] }>;
  matchPercentage?: number;
}

/**
 * Custom hook to manage recipe generation functionality
 */
export const useRecipeGeneration = (
  allRecipes: Recipe[],
  userRecipes: Recipe[],
  userId?: string
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<ExtendedScrapedRecipe | null>(null);
  const [matchedExistingRecipes, setMatchedExistingRecipes] = useState<MatchedRecipe[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Auto image generation hook
  const {
    isGenerating: isGeneratingImage,
    progress: imageProgress,
    generateImageForRecipe,
  } = useAutoImageGeneration();

  const generateRecipes = useCallback(
    async (ingredients: FridgeIngredient[], options: RecipeGenerationOptions) => {
      if (ingredients.length === 0) {
        return;
      }

      setIsGenerating(true);
      setGenerationError(null);

      try {
        const ingredientNames = ingredients.map((ing) => ing.name);

        // Generate recipes using named parameters for better readability
        const aiResult = await generateMultipleRecipesFromIngredients({
          ingredients: ingredientNames,
          numberOfRecipes: RECIPES_PER_GENERATION,
          dietary: options.dietary,
          cuisine: options.cuisine,
          cookingTime: options.cookingTime,
          category: options.category,
          matchingStrictness: options.matchingStrictness,
          excludeTitles: options.excludeTitles || [],
        });

        if (aiResult.success && aiResult.recipes && aiResult.recipes.length > 0) {
          console.log(`Generated ${RECIPES_PER_GENERATION} AI recipe${RECIPES_PER_GENERATION > 1 ? 's' : ''}`);

          const firstRecipe = aiResult.recipes[0];

          // Auto-generate cover image for the first recipe
          if (userId) {
            console.log('Auto-generating cover image for My Fridge recipe...');
            const tempRecipeId = Crypto.randomUUID();

            const imageResult = await generateImageForRecipe({
              userId,
              recipeId: tempRecipeId,
              recipeData: {
                title: firstRecipe.title,
                description: firstRecipe.description,
                ingredients: firstRecipe.ingredients,
                category: firstRecipe.category,
                tags: firstRecipe.tags,
              },
              silent: true,
            });

            if (imageResult.success && imageResult.imageUrl) {
              // Add the generated image URL to the recipe
              firstRecipe.image = imageResult.imageUrl;
              console.log('Cover image auto-generated for My Fridge recipe:', imageResult.imageUrl);
            } else if (!imageResult.skipped) {
              console.warn('Cover image generation failed:', imageResult.error);
            }
          }

          setCurrentRecipe(firstRecipe);
        } else {
          setGenerationError(aiResult.error || 'Failed to generate recipe');
          setCurrentRecipe(null);
        }

        // Match existing recipes from user's collection
        const allUserRecipes = [...allRecipes, ...userRecipes];
        const matchedRecipes = getTopMatchedRecipes(
          ingredientNames,
          allUserRecipes,
          5, // Top 5 matches
          50 // Minimum 50% match
        );
        console.log(`Found ${matchedRecipes.length} matching existing recipes`);
        setMatchedExistingRecipes(matchedRecipes);

        // Don't show results modal - display inline instead
        // setShowResultsModal(true);
      } catch (error) {
        console.error('Error generating recipes:', error);
        setGenerationError('An unexpected error occurred');
      } finally {
        setIsGenerating(false);
      }
    },
    [allRecipes, userRecipes, userId, generateImageForRecipe]
  );

  const clearCurrentRecipe = useCallback(() => {
    setCurrentRecipe(null);
  }, []);

  return {
    isGenerating: isGenerating || isGeneratingImage,
    generationError,
    currentRecipe,
    matchedExistingRecipes,
    showResultsModal,
    setShowResultsModal,
    generateRecipes,
    clearCurrentRecipe,
    imageProgress, // Expose image generation progress
  };
};
