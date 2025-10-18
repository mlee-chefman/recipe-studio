import { CookingAction } from './chefiq';

/**
 * Represents a single step in a recipe
 * Contains the step text, optional image, and optional cooking action
 */
export interface Step {
  text: string;
  image?: string;
  cookingAction?: CookingAction;
}

/**
 * Helper to create a new step from text
 */
export function createStep(text: string, image?: string, cookingAction?: CookingAction): Step {
  return {
    text,
    image,
    cookingAction,
  };
}

/**
 * Helper to create an empty step
 */
export function createEmptyStep(): Step {
  return {
    text: '',
  };
}

/**
 * Convert old format (separate arrays) to new Step objects
 * Used for migration
 */
export function migrateToSteps(
  instructions: string[],
  images?: (string | undefined)[],
  cookingActions?: CookingAction[]
): Step[] {
  return instructions.map((text, index) => {
    const step: Step = { text };

    // Add image if exists
    if (images && images[index]) {
      step.image = images[index];
    }

    // Add cooking action if exists for this step
    if (cookingActions) {
      const action = cookingActions.find(a => a.stepIndex === index);
      if (action) {
        // Remove stepIndex as it's now implicit in the array position
        const { stepIndex, ...actionWithoutIndex } = action as any;
        step.cookingAction = actionWithoutIndex;
      }
    }

    return step;
  });
}

/**
 * Convert new Step objects to old format (for compatibility)
 */
export function stepsToLegacyFormat(steps: Step[]): {
  instructions: string[];
  instructionImages?: (string | undefined)[];
  cookingActions?: CookingAction[];
} {
  const texts = steps.map(s => s.text);
  const images = steps.map(s => s.image);
  const cookingActions = steps
    .map((step, index): CookingAction | null =>
      step.cookingAction
        ? { ...step.cookingAction, stepIndex: index } as CookingAction
        : null
    )
    .filter((a): a is CookingAction => a !== null);

  return {
    instructions: texts,
    instructionImages: images.some(img => img) ? images : undefined,
    cookingActions: cookingActions.length > 0 ? cookingActions : undefined,
  };
}
