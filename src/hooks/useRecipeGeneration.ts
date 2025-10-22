import { useState, useCallback } from 'react';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { MatchedRecipe, getTopMatchedRecipes } from '~/utils/ingredientMatcher';
import { generateMultipleRecipesFromIngredients } from '~/services/gemini.service';
import { FridgeIngredient } from '~/types/ingredient';
import { Recipe } from '~/types/recipe';

interface RecipeGenerationOptions {
  dietary?: string;
  cuisine?: string;
  cookingTime?: string;
  matchingStrictness?: 'exact' | 'substitutions' | 'creative';
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
  const [aiGeneratedRecipes, setAiGeneratedRecipes] = useState<ExtendedScrapedRecipe[]>([]);
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

        // Generate AI recipes (3 options)
        const aiResult = await generateMultipleRecipesFromIngredients(
          ingredientNames,
          3,
          options.dietary,
          options.cuisine,
          options.cookingTime,
          options.matchingStrictness
        );

        if (aiResult.success && aiResult.recipes) {
          console.log(`Generated ${aiResult.recipes.length} AI recipes`);
          setAiGeneratedRecipes(aiResult.recipes);
        } else {
          setGenerationError(aiResult.error || 'Failed to generate recipes');
          setAiGeneratedRecipes([]);
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

        // Show results modal
        setShowResultsModal(true);
      } catch (error) {
        console.error('Error generating recipes:', error);
        setGenerationError('An unexpected error occurred');
      } finally {
        setIsGenerating(false);
      }
    },
    [allRecipes, userRecipes]
  );

  return {
    isGenerating,
    generationError,
    aiGeneratedRecipes,
    matchedExistingRecipes,
    showResultsModal,
    setShowResultsModal,
    generateRecipes,
  };
};
