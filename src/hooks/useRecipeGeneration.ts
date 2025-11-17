import { useState, useCallback } from 'react';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { MatchedRecipe, getTopMatchedRecipes } from '~/utils/ingredientMatcher';
import { generateMultipleRecipesFromIngredients, generateFullCourseMenu, analyzeCookingActionsWithGemini } from '~/services/gemini.service';
import { FridgeIngredient } from '~/types/ingredient';
import { Recipe } from '~/types/recipe';
import { RECIPES_PER_GENERATION, MIN_INGREDIENTS_FOR_FULL_COURSE } from '@constants/myFridgeConstants';
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
  const [aiGeneratedRecipes, setAiGeneratedRecipes] = useState<ExtendedScrapedRecipe[]>([]);
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
          // Auto-generate cover images and detect appliances for all recipes
          const recipesWithImagesAndAppliances = await Promise.all(
            aiResult.recipes.map(async (recipe) => {
              // Generate cover image
              if (userId) {
                const tempRecipeId = Crypto.randomUUID();

                const imageResult = await generateImageForRecipe({
                  userId,
                  recipeId: tempRecipeId,
                  recipeData: {
                    title: recipe.title,
                    description: recipe.description,
                    ingredients: recipe.ingredients,
                    category: recipe.category,
                    tags: recipe.tags,
                  },
                  silent: true,
                });

                if (imageResult.success && imageResult.imageUrl) {
                  recipe.image = imageResult.imageUrl;
                }
              }

              // Detect cooking appliances
              try {
                const applianceResult = await analyzeCookingActionsWithGemini(
                  recipe.title,
                  recipe.description,
                  recipe.steps,
                  recipe.cookTime
                );

                if (applianceResult && applianceResult.suggestedActions && applianceResult.suggestedActions.length > 0) {
                  // Map cooking actions to their corresponding steps
                  const stepsWithActions = recipe.steps.map((step, index) => {
                    const actionForThisStep = applianceResult.suggestedActions.find(
                      (action: any) => action.stepIndex === index
                    );
                    return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
                  });

                  recipe.steps = stepsWithActions;
                  recipe.chefiqSuggestions = applianceResult;
                }
              } catch (error) {
                // Continue without appliances if detection fails
              }

              return recipe;
            })
          );

          setAiGeneratedRecipes(recipesWithImagesAndAppliances);
          setCurrentRecipe(recipesWithImagesAndAppliances[0]); // Keep for backward compatibility
        } else {
          setGenerationError(aiResult.error || 'Failed to generate recipe');
          setCurrentRecipe(null);
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
        setMatchedExistingRecipes(matchedRecipes);

        // Show results modal with both AI and existing recipes
        setShowResultsModal(true);
      } catch (error) {
        console.error('Error generating recipes:', error);
        setGenerationError('An unexpected error occurred');
      } finally {
        setIsGenerating(false);
      }
    },
    [allRecipes, userRecipes, userId, generateImageForRecipe]
  );

  const generateFullCourse = useCallback(
    async (ingredients: FridgeIngredient[], options: RecipeGenerationOptions) => {
      if (ingredients.length < MIN_INGREDIENTS_FOR_FULL_COURSE) {
        setGenerationError(`At least ${MIN_INGREDIENTS_FOR_FULL_COURSE} ingredients required for full course menu`);
        return;
      }

      setIsGenerating(true);
      setGenerationError(null);

      try {
        const ingredientNames = ingredients.map((ing) => ing.name);

        // Generate full course menu (4 recipes: appetizer, main, dessert, beverage)
        const aiResult = await generateFullCourseMenu(
          ingredientNames,
          options.dietary,
          options.cuisine,
          options.cookingTime
        );

        if (aiResult.success && aiResult.recipes && aiResult.recipes.length > 0) {
          // Auto-generate cover images and detect appliances for all courses
          const recipesWithImagesAndAppliances = await Promise.all(
            aiResult.recipes.map(async (recipe) => {
              // Generate cover image
              if (userId) {
                const tempRecipeId = Crypto.randomUUID();

                const imageResult = await generateImageForRecipe({
                  userId,
                  recipeId: tempRecipeId,
                  recipeData: {
                    title: recipe.title,
                    description: recipe.description,
                    ingredients: recipe.ingredients,
                    category: recipe.category,
                    tags: recipe.tags,
                  },
                  silent: true,
                });

                if (imageResult.success && imageResult.imageUrl) {
                  recipe.image = imageResult.imageUrl;
                  console.log('Cover image auto-generated:', imageResult.imageUrl);
                } else if (!imageResult.skipped) {
                  console.warn('Cover image generation failed:', imageResult.error);
                }
              }

              // Detect cooking appliances
              try {
                console.log(`Detecting appliances for ${recipe.category}: ${recipe.title}`);
                const applianceResult = await analyzeCookingActionsWithGemini(
                  recipe.title,
                  recipe.description,
                  recipe.steps,
                  recipe.cookTime
                );

                if (applianceResult && applianceResult.suggestedActions && applianceResult.suggestedActions.length > 0) {
                  // Map cooking actions to their corresponding steps
                  const stepsWithActions = recipe.steps.map((step, index) => {
                    const actionForThisStep = applianceResult.suggestedActions.find(
                      (action: any) => action.stepIndex === index
                    );
                    return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
                  });

                  recipe.steps = stepsWithActions;
                  recipe.chefiqSuggestions = applianceResult;
                }
              } catch (error) {
                // Continue without appliances if detection fails
              }

              return recipe;
            })
          );

          setAiGeneratedRecipes(recipesWithImagesAndAppliances);
          setCurrentRecipe(recipesWithImagesAndAppliances[0]); // Keep for backward compatibility
        } else {
          setGenerationError(aiResult.error || 'Failed to generate full course menu');
          setCurrentRecipe(null);
          setAiGeneratedRecipes([]);
        }

        // Don't show existing matched recipes for full course (not relevant)
        setMatchedExistingRecipes([]);

        // Show results modal with full course
        setShowResultsModal(true);
      } catch (error) {
        console.error('Error generating full course menu:', error);
        setGenerationError('An unexpected error occurred');
      } finally {
        setIsGenerating(false);
      }
    },
    [userId, generateImageForRecipe]
  );

  const clearCurrentRecipe = useCallback(() => {
    setCurrentRecipe(null);
    setAiGeneratedRecipes([]);
  }, []);

  const updateSingleCourse = useCallback((courseType: string, newRecipe: ExtendedScrapedRecipe) => {
    setAiGeneratedRecipes(prevRecipes => {
      const courseIndex = prevRecipes.findIndex((r: any) => r.courseType === courseType);
      if (courseIndex !== -1) {
        const updatedRecipes = [...prevRecipes];
        updatedRecipes[courseIndex] = newRecipe;
        return updatedRecipes;
      }
      return prevRecipes;
    });
  }, []);

  return {
    isGenerating: isGenerating || isGeneratingImage,
    generationError,
    currentRecipe,
    aiGeneratedRecipes,
    matchedExistingRecipes,
    showResultsModal,
    setShowResultsModal,
    generateRecipes,
    generateFullCourse,
    clearCurrentRecipe,
    updateSingleCourse,
    imageProgress, // Expose image generation progress
  };
};
