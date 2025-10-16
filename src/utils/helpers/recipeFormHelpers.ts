/**
 * Helper functions for managing recipe form ingredients and instructions
 * These are pure functions that return validation results or new arrays
 */

/**
 * Result type for operations that may fail validation
 */
export type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

/**
 * Adds a new empty ingredient to the list
 * Validates that the last ingredient is not empty before adding
 */
export function addIngredient(currentIngredients: string[]): ValidationResult<string[]> {
  const lastIngredient = currentIngredients[currentIngredients.length - 1];

  if (lastIngredient && lastIngredient.trim() === '') {
    return {
      success: false,
      error: 'Please fill in the current ingredient before adding a new one.',
    };
  }

  return {
    success: true,
    value: [...currentIngredients, ''],
  };
}

/**
 * Removes an ingredient at the specified index
 * Always maintains at least one empty ingredient in the list
 */
export function removeIngredient(currentIngredients: string[], index: number): string[] {
  const newIngredients = currentIngredients.filter((_, i) => i !== index);
  return newIngredients.length > 0 ? newIngredients : [''];
}

/**
 * Updates an ingredient at the specified index
 */
export function updateIngredient(
  currentIngredients: string[],
  index: number,
  value: string
): string[] {
  const newIngredients = [...currentIngredients];
  newIngredients[index] = value;
  return newIngredients;
}

/**
 * Adds a new empty instruction to the list
 * Validates that the last instruction is not empty before adding
 */
export function addInstruction(currentInstructions: string[]): ValidationResult<string[]> {
  const lastInstruction = currentInstructions[currentInstructions.length - 1];

  if (lastInstruction && lastInstruction.trim() === '') {
    return {
      success: false,
      error: 'Please fill in the current instruction before adding a new one.',
    };
  }

  return {
    success: true,
    value: [...currentInstructions, ''],
  };
}

/**
 * Removes an instruction at the specified index
 * Always maintains at least one empty instruction in the list
 */
export function removeInstruction(currentInstructions: string[], index: number): string[] {
  const newInstructions = currentInstructions.filter((_, i) => i !== index);
  return newInstructions.length > 0 ? newInstructions : [''];
}

/**
 * Updates an instruction at the specified index
 */
export function updateInstruction(
  currentInstructions: string[],
  index: number,
  value: string
): string[] {
  const newInstructions = [...currentInstructions];
  newInstructions[index] = value;
  return newInstructions;
}
