import { useState } from 'react';
import { CookingAction } from '~/types/chefiq';

interface FormData {
  cookingActions: CookingAction[];
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
      const newActions = formData.cookingActions.map((a) =>
        a.stepIndex === editingCookingAction.stepIndex
          ? { ...action, stepIndex: editingCookingAction.stepIndex, id: a.id }
          : a
      );
      updateFormData({ cookingActions: newActions });
      setEditingCookingAction(null);
    } else if (formData.currentStepIndex !== null) {
      // Remove any existing action for this step
      const newActions = formData.cookingActions.filter(
        (a) => a.stepIndex !== formData.currentStepIndex
      );
      // Add the new action
      newActions.push({
        ...action,
        stepIndex: formData.currentStepIndex,
        id: `step_${formData.currentStepIndex}_${Date.now()}`,
      });
      updateFormData({ cookingActions: newActions });
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
    return formData.cookingActions.find((action) => action.stepIndex === stepIndex);
  };

  return {
    editingCookingAction,
    setEditingCookingAction,
    handleCookingActionSelect,
    handleEditCookingAction,
    getCookingActionForStep,
  };
}
