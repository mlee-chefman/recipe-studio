import { useState } from 'react';
import { CookingAction } from '~/types/chefiq';
import { Step } from '~/types/recipe';
import * as recipeHelpers from '@utils/helpers/recipeFormHelpers';

interface FormData {
  steps: Step[];
  currentStepIndex: number | null;
  [key: string]: any;
}

interface ModalStates {
  showCookingSelector: boolean;
  [key: string]: any;
}

interface UseCookingActionsParams {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  updateModalStates: (updates: Partial<ModalStates>) => void;
}

interface UseCookingActionsReturn {
  editingCookingAction: { action: CookingAction; stepIndex: number } | null;
  setEditingCookingAction: (value: { action: CookingAction; stepIndex: number } | null) => void;
  handleCookingActionSelect: (action: CookingAction) => void;
  handleEditCookingAction: (stepIndex: number) => void;
  getCookingActionForStep: (stepIndex: number) => CookingAction | undefined;
}

/**
 * Custom hook for managing cooking actions in recipe forms
 * Handles selecting, editing, and retrieving cooking actions for recipe steps
 */
export function useCookingActions({
  formData,
  updateFormData,
  updateModalStates,
}: UseCookingActionsParams): UseCookingActionsReturn {
  const [editingCookingAction, setEditingCookingAction] = useState<{
    action: CookingAction;
    stepIndex: number;
  } | null>(null);

  /**
   * Handles selection of a cooking action from the cooking selector modal
   * If editing an existing action, updates it. Otherwise, adds a new action for the current step.
   */
  const handleCookingActionSelect = (action: CookingAction) => {
    if (editingCookingAction) {
      // Update existing action
      const newSteps = recipeHelpers.updateStepCookingAction(
        formData.steps,
        editingCookingAction.stepIndex,
        action
      );
      updateFormData({ steps: newSteps });
      setEditingCookingAction(null);
    } else if (formData.currentStepIndex !== null) {
      // Add/replace the action for the current step
      const newSteps = recipeHelpers.updateStepCookingAction(
        formData.steps,
        formData.currentStepIndex,
        action
      );
      updateFormData({ steps: newSteps });
    }
    updateModalStates({ showCookingSelector: false });
    updateFormData({ currentStepIndex: null });
  };

  /**
   * Handles editing an existing cooking action
   * Opens the cooking selector modal with the current action's data
   */
  const handleEditCookingAction = (stepIndex: number) => {
    const action = getCookingActionForStep(stepIndex);
    if (action) {
      setEditingCookingAction({ action, stepIndex });
      updateModalStates({ showCookingSelector: true });
    }
  };

  /**
   * Retrieves the cooking action for a specific step index
   */
  const getCookingActionForStep = (stepIndex: number): CookingAction | undefined => {
    return recipeHelpers.getCookingActionForStep(formData.steps, stepIndex);
  };

  return {
    editingCookingAction,
    setEditingCookingAction,
    handleCookingActionSelect,
    handleEditCookingAction,
    getCookingActionForStep,
  };
}
