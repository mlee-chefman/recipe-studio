import { Step } from '~/types/recipe';

/**
 * Helper functions for managing recipe form ingredients and steps
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
 * Adds a new empty step to the list
 * Validates that the last step is not empty before adding
 */
export function addStep(currentSteps: Step[]): ValidationResult<Step[]> {
  const lastStep = currentSteps[currentSteps.length - 1];

  if (lastStep && lastStep.text.trim() === '') {
    return {
      success: false,
      error: 'Please fill in the current step before adding a new one.',
    };
  }

  return {
    success: true,
    value: [...currentSteps, { text: '' }],
  };
}

/**
 * Removes a step at the specified index
 * Always maintains at least one empty step in the list
 */
export function removeStep(currentSteps: Step[], index: number): Step[] {
  const newSteps = currentSteps.filter((_, i) => i !== index);
  return newSteps.length > 0 ? newSteps : [{ text: '' }];
}

/**
 * Updates a step text at the specified index
 */
export function updateStepText(
  currentSteps: Step[],
  index: number,
  text: string
): Step[] {
  const newSteps = [...currentSteps];
  newSteps[index] = {
    ...newSteps[index],
    text,
  };
  return newSteps;
}

/**
 * Updates a step image at the specified index
 */
export function updateStepImage(
  currentSteps: Step[],
  index: number,
  imageUri: string | undefined
): Step[] {
  const newSteps = [...currentSteps];
  newSteps[index] = {
    ...newSteps[index],
    image: imageUri,
  };
  return newSteps;
}

/**
 * Updates a cooking action for a step at the specified index
 */
export function updateStepCookingAction(
  currentSteps: Step[],
  index: number,
  cookingAction: any | undefined
): Step[] {
  const newSteps = [...currentSteps];
  newSteps[index] = {
    ...newSteps[index],
    cookingAction,
  };
  return newSteps;
}

/**
 * Gets the cooking action for a specific step
 */
export function getCookingActionForStep(steps: Step[], index: number): any | undefined {
  return steps[index]?.cookingAction;
}
