import { ScrapedRecipe } from '~/utils/recipeScraper';

/**
 * Fallback parser when Gemini AI is not available
 * Parses recipe text using basic text analysis
 */
export function parseRecipeFromText(text: string, imageUri: string): ScrapedRecipe {
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  // Try to find title (usually first line or largest text)
  const title = lines[0] || 'Untitled Recipe';

  // Find ingredients section
  const ingredientKeywords = ['ingredient', 'ingredients:', 'what you need', 'you will need'];
  const ingredientStartIndex = lines.findIndex(line =>
    ingredientKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );

  // Find instructions section
  const instructionKeywords = ['instruction', 'instructions:', 'direction', 'directions:', 'method', 'steps', 'how to'];
  const instructionStartIndex = lines.findIndex(line =>
    instructionKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );

  let ingredients: string[] = [];
  let instructions: string[] = [];

  if (ingredientStartIndex !== -1) {
    const endIndex = instructionStartIndex !== -1 ? instructionStartIndex : lines.length;
    ingredients = lines
      .slice(ingredientStartIndex + 1, endIndex)
      .filter(line => {
        const trimmed = line.trim();
        // Skip section headers
        return !instructionKeywords.some(keyword => trimmed.toLowerCase().includes(keyword));
      })
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  if (instructionStartIndex !== -1) {
    instructions = lines
      .slice(instructionStartIndex + 1)
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  // If parsing failed, put all text as instructions
  if (ingredients.length === 0 && instructions.length === 0) {
    instructions = lines.slice(1); // Skip title
  }

  return {
    title,
    description: '',
    ingredients: ingredients.length > 0 ? ingredients : [''],
    instructions: instructions.length > 0 ? instructions : [''],
    cookTime: 30,
    prepTime: 15,
    servings: 4,
    category: '',
    image: imageUri,
  };
}
