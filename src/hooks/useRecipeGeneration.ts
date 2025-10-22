import { useState, useCallback } from 'react';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { MatchedRecipe, getTopMatchedRecipes } from '~/utils/ingredientMatcher';
import { generateMultipleRecipesFromIngredients } from '~/services/gemini.service';
import { FridgeIngredient } from '~/types/ingredient';
import { Recipe } from '~/types/recipe';
import { RECIPES_PER_GENERATION } from '@constants/myFridgeConstants';

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
  userRecipes: Recipe[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<ExtendedScrapedRecipe | null>(null);
  const [matchedExistingRecipes, setMatchedExistingRecipes] = useState<MatchedRecipe[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);

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
          setCurrentRecipe(aiResult.recipes[0]);
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
    [allRecipes, userRecipes]
  );

  const clearCurrentRecipe = useCallback(() => {
    setCurrentRecipe(null);
  }, []);

  return {
    isGenerating,
    generationError,
    currentRecipe,
    matchedExistingRecipes,
    showResultsModal,
    setShowResultsModal,
    generateRecipes,
    clearCurrentRecipe,
  };
};
