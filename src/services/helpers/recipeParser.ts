import { ScrapedRecipe } from '@utils/recipeScraper';
import { analyzeRecipeForChefIQ } from '@utils/recipeAnalyzer';
import { Step } from '~/types/recipe';

/**
 * Clean ingredient quantities by rounding decimals to 2 places
 */
export function cleanIngredientQuantities(ingredients: string[]): string[] {
  return ingredients.map(ingredient => {
    // Match decimal numbers with more than 2 decimal places
    return ingredient.replace(/(\d+\.\d{3,})/g, (match) => {
      const num = parseFloat(match);
      return num.toFixed(2);
    });
  });
}

/**
 * Extract JSON from Gemini response (handles markdown code blocks)
 */
export function extractJSON(responseText: string): string {
  let jsonText = responseText.trim();

  // Remove markdown code blocks if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/g, '');
  }

  return jsonText;
}

/**
 * Build ScrapedRecipe object from parsed JSON data
 */
function buildRecipeObject(parsed: any, imageUri?: string): ScrapedRecipe {
  // Validate required fields
  if (!parsed.title) {
    parsed.title = 'Untitled Recipe';
  }

  // Ensure arrays exist
  if (!Array.isArray(parsed.ingredients)) {
    parsed.ingredients = [];
  }
  if (!Array.isArray(parsed.steps)) {
    parsed.steps = [];
  }

  // Convert instructions to Step objects (handle both old string format and new object format)
  const steps: Step[] = parsed.steps
    .filter((inst: any) => {
      // Handle both string format and object format
      if (typeof inst === 'string') {
        return inst && inst.trim();
      } else if (inst && typeof inst === 'object' && inst.text) {
        return inst.text.trim();
      }
      return false;
    })
    .map((inst: any) => {
      // If already an object with text field, use it; otherwise convert string to object
      if (typeof inst === 'string') {
        return { text: inst };
      } else {
        return { text: inst.text, image: inst.image, cookingAction: inst.cookingAction };
      }
    });

  // Build the ScrapedRecipe object
  const recipe: ScrapedRecipe = {
    title: parsed.title || 'Untitled Recipe',
    description: parsed.description || parsed.notes || '',
    ingredients: cleanIngredientQuantities(
      parsed.ingredients.filter((ing: any) => ing && ing.trim())
    ),
    steps,
    cookTime: parseInt(parsed.cookTime) || 30,
    prepTime: parseInt(parsed.prepTime) || 15,
    servings: parseInt(parsed.servings) || 4,
    category: parsed.category || 'General',
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter((tag: any) => tag && tag.trim()) : [],
    image: imageUri || '',
  };

  // Append notes to description if both exist
  if (parsed.notes && parsed.notes !== parsed.description) {
    recipe.description = recipe.description
      ? `${recipe.description}\n\nNotes: ${parsed.notes}`
      : `Notes: ${parsed.notes}`;
  }

  return recipe;
}

/**
 * Parses Gemini's single-recipe response into a ScrapedRecipe object
 */
export function parseGeminiResponse(
  responseText: string,
  imageUri?: string
): ScrapedRecipe | null {
  try {
    const jsonText = extractJSON(responseText);
    const parsed = JSON.parse(jsonText);
    const recipe = buildRecipeObject(parsed, imageUri);

    // Validate that we have at least some content
    if (recipe.ingredients.length === 0 && recipe.steps.length === 0) {
      console.warn('Parsed recipe has no ingredients or steps');
      return null;
    }

    // Analyze recipe for ChefIQ appliance suggestions
    try {
      const chefiqAnalysis = analyzeRecipeForChefIQ(
        recipe.title,
        recipe.description,
        recipe.steps,
        recipe.cookTime
      );

      // Attach ChefIQ suggestions to the recipe
      if (chefiqAnalysis && chefiqAnalysis.suggestedActions.length > 0) {
        // Map cooking actions directly to their corresponding steps
        const stepsWithActions = recipe.steps.map((step, index) => {
          const actionForThisStep = chefiqAnalysis.suggestedActions.find(
            action => action.stepIndex === index
          );
          return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
        });

        recipe.steps = stepsWithActions;
        recipe.chefiqSuggestions = chefiqAnalysis;
        console.log('ChefIQ Analysis:', chefiqAnalysis);
      }
    } catch (error) {
      console.error('ChefIQ analysis failed:', error);
      // Don't fail the whole recipe if analysis fails
    }

    return recipe;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    console.error('Response text:', responseText);
    return null;
  }
}

/**
 * Parses Gemini's multi-recipe response into an array of ScrapedRecipe objects
 */
export function parseMultiRecipeResponse(responseText: string): ScrapedRecipe[] {
  try {
    const jsonText = extractJSON(responseText);
    const parsedArray = JSON.parse(jsonText);

    // Ensure it's an array
    if (!Array.isArray(parsedArray)) {
      console.error('Response is not an array');
      return [];
    }

    const recipes: ScrapedRecipe[] = [];

    // Process each recipe
    for (let i = 0; i < parsedArray.length; i++) {
      const parsed = parsedArray[i];
      const recipe = buildRecipeObject(parsed);

      // Validate that we have at least some content
      if (recipe.ingredients.length > 0 || recipe.steps.length > 0) {
        // Analyze recipe for ChefIQ appliance suggestions
        try {
          const chefiqAnalysis = analyzeRecipeForChefIQ(
            recipe.title,
            recipe.description,
            recipe.steps,
            recipe.cookTime
          );

          // Attach ChefIQ suggestions to the recipe
          if (chefiqAnalysis && chefiqAnalysis.suggestedActions.length > 0) {
            // Map cooking actions directly to their corresponding steps
            const stepsWithActions = recipe.steps.map((step, index) => {
              const actionForThisStep = chefiqAnalysis.suggestedActions.find(
                action => action.stepIndex === index
              );
              return actionForThisStep ? { ...step, cookingAction: actionForThisStep } : step;
            });

            recipe.steps = stepsWithActions;
            recipe.chefiqSuggestions = chefiqAnalysis;
          }
        } catch (error) {
          console.error(`ChefIQ analysis failed for recipe ${i + 1}:`, error);
          // Don't fail the whole recipe if analysis fails
        }

        recipes.push(recipe);
      } else {
        console.warn(`Skipping recipe ${i + 1} - no ingredients or steps`);
      }
    }

    return recipes;
  } catch (error) {
    console.error('Failed to parse multi-recipe response:', error);
    console.error('Response text:', responseText);
    return [];
  }
}
