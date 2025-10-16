import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Recipe, useRecipeStore } from '@store/store';
import {
  RECIPE_DEFAULTS,
  RecipeFormState,
  RecipeModalState,
  getInitialFormState,
  getInitialModalState,
  hasFormData,
  hasFormChanges
} from '~/constants/recipeDefaults';
import { CookingAction, InstructionSection } from '~/types/chefiq';

export interface UseRecipeFormProps {
  editingRecipe?: Recipe;
  onComplete?: () => void;
}

export const useRecipeForm = ({ editingRecipe, onComplete }: UseRecipeFormProps = {}) => {
  const navigation = useNavigation();
  const { addRecipe, updateRecipe, deleteRecipe } = useRecipeStore();

  // Form state
  const [formData, setFormData] = useState<RecipeFormState>(getInitialFormState());
  const [modalStates, setModalStates] = useState<RecipeModalState>(getInitialModalState());
  const [instructionSections, setInstructionSections] = useState<InstructionSection[]>([]);
  const [isIngredientsReorderMode, setIsIngredientsReorderMode] = useState(false);
  const [isInstructionsReorderMode, setIsInstructionsReorderMode] = useState(false);
  const [isDraggingCookingAction, setIsDraggingCookingAction] = useState(false);
  const [draggingCookingAction, setDraggingCookingAction] = useState<{ action: any; fromStepIndex: number } | null>(null);

  // Helper functions for state updates
  const updateFormData = (updates: Partial<RecipeFormState>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateModalStates = (updates: Partial<RecipeModalState>) => {
    setModalStates(prev => ({ ...prev, ...updates }));
  };

  const setCookTimeFromMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    updateFormData({
      cookTime: totalMinutes,
      cookTimeHours: hours,
      cookTimeMinutes: minutes
    });
  };

  // Reorder handlers for drag and drop
  const reorderIngredients = (newIngredients: string[]) => {
    updateFormData({ ingredients: newIngredients });
  };

  const reorderInstructions = (newInstructions: string[]) => {
    // Also need to update cooking action indices
    const oldToNewIndexMap: { [key: number]: number } = {};
    formData.instructions.forEach((instruction, oldIndex) => {
      const newIndex = newInstructions.findIndex(inst => inst === instruction);
      if (newIndex !== -1) {
        oldToNewIndexMap[oldIndex] = newIndex;
      }
    });

    // Update cooking actions with new step indices
    const updatedCookingActions = formData.cookingActions.map(action => ({
      ...action,
      stepIndex: oldToNewIndexMap[action.stepIndex] !== undefined ?
        oldToNewIndexMap[action.stepIndex] : action.stepIndex
    }));

    updateFormData({
      instructions: newInstructions,
      cookingActions: updatedCookingActions
    });
  };

  const moveCookingAction = (fromStepIndex: number, toStepIndex: number) => {
    const action = formData.cookingActions.find(a => a.stepIndex === fromStepIndex);
    if (action) {
      const updatedActions = formData.cookingActions.map(a => {
        if (a.stepIndex === fromStepIndex) {
          return { ...a, stepIndex: toStepIndex };
        }
        return a;
      });
      updateFormData({ cookingActions: updatedActions });
    }
  };

  // Cooking Action Drag and Drop handlers
  const handleCookingActionDragStart = (fromStepIndex: number) => {
    const action = formData.cookingActions.find(a => a.stepIndex === fromStepIndex);
    if (action) {
      setDraggingCookingAction({ action, fromStepIndex });
      setIsDraggingCookingAction(true);
    }
  };

  const handleCookingActionDragEnd = (fromStepIndex: number, toStepIndex: number) => {
    console.log('Drag end:', { fromStepIndex, toStepIndex, totalInstructions: formData.instructions.length });

    // Ensure target step is valid
    const maxStepIndex = Math.max(0, formData.instructions.length - 1);
    const validToStepIndex = Math.min(Math.max(0, toStepIndex), maxStepIndex);

    if (fromStepIndex !== validToStepIndex) {
      const action = formData.cookingActions.find(a => a.stepIndex === fromStepIndex);

      if (action) {
        console.log('Moving action from step', fromStepIndex, 'to step', validToStepIndex);

        // Create new actions array by updating the step index
        const updatedActions = formData.cookingActions.map(a => {
          if (a.stepIndex === fromStepIndex) {
            return { ...a, stepIndex: validToStepIndex };
          }
          // Remove any existing action on target step (if different from source)
          if (a.stepIndex === validToStepIndex && validToStepIndex !== fromStepIndex) {
            return null;
          }
          return a;
        }).filter(Boolean); // Remove nulls

        updateFormData({ cookingActions: updatedActions });
      }
    }

    setIsDraggingCookingAction(false);
    setDraggingCookingAction(null);
  };

  const removeCookingAction = (stepIndex: number) => {
    updateFormData({
      cookingActions: formData.cookingActions.filter(action => action.stepIndex !== stepIndex)
    });
  };

  const resetForm = () => {
    setFormData(getInitialFormState());
    setModalStates(getInitialModalState());
    setInstructionSections([]);
  };

  // Populate form when editing
  useEffect(() => {
    if (editingRecipe) {
      setCookTimeFromMinutes(editingRecipe.cookTime);
      updateFormData({
        title: editingRecipe.title,
        imageUrl: editingRecipe.image || '',
        category: editingRecipe.category,
        tags: editingRecipe.tags || [],
        servings: editingRecipe.servings || RECIPE_DEFAULTS.SERVINGS,
        difficulty: editingRecipe.difficulty,
        ingredients: editingRecipe.ingredients.length > 0 ? editingRecipe.ingredients : [''],
        instructions: editingRecipe.instructions.length > 0 ? editingRecipe.instructions : [''],
        notes: editingRecipe.description,
        selectedAppliance: editingRecipe.chefiqAppliance || '',
        cookingActions: editingRecipe.cookingActions || [],
        useProbe: editingRecipe.useProbe || false
      });
      setInstructionSections(editingRecipe.instructionSections || []);
    }
  }, [editingRecipe]);

  const handleSave = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Recipe title is required');
      return;
    }

    const validIngredients = formData.ingredients.filter(i => i.trim() !== '');
    if (validIngredients.length === 0) {
      Alert.alert('Error', 'At least one ingredient is required');
      return;
    }

    const validInstructions = formData.instructions.filter(i => i.trim() !== '');
    if (validInstructions.length === 0) {
      Alert.alert('Error', 'At least one instruction is required');
      return;
    }

    const recipe = {
      title: formData.title.trim(),
      description: formData.notes.trim() || 'No description provided',
      ingredients: validIngredients,
      instructions: validInstructions,
      cookTime: formData.cookTime,
      servings: formData.servings,
      difficulty: formData.difficulty,
      category: formData.category.trim() || 'Uncategorized',
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      image: formData.imageUrl.trim() || undefined,
      chefiqAppliance: formData.selectedAppliance || undefined,
      cookingActions: formData.cookingActions.length > 0 ? formData.cookingActions : undefined,
      instructionSections: instructionSections.length > 0 ? instructionSections : undefined,
      useProbe: formData.useProbe || undefined,
    };

    if (editingRecipe) {
      updateRecipe(editingRecipe.id, recipe);
      Alert.alert('Success', 'Recipe updated!', [
        { text: 'OK', onPress: onComplete || (() => navigation.goBack()) }
      ]);
    } else {
      addRecipe(recipe);
      Alert.alert('Success', 'Recipe created!', [
        { text: 'OK', onPress: onComplete || (() => navigation.navigate('One' as never)) }
      ]);
    }
  };

  const handleCancel = () => {
    const hasChanges = editingRecipe
      ? hasFormChanges(formData, editingRecipe)
      : hasFormData(formData);

    if (hasChanges) {
      updateModalStates({ showCancelConfirmation: true });
    } else {
      if (!editingRecipe) {
        resetForm();
      }
      if (onComplete) {
        onComplete();
      } else {
        navigation.goBack();
      }
    }
  };

  const confirmCancel = () => {
    updateModalStates({ showCancelConfirmation: false });
    if (!editingRecipe) {
      resetForm();
    }
    if (onComplete) {
      onComplete();
    } else {
      navigation.goBack();
    }
  };

  const handleDelete = () => {
    if (!editingRecipe) return;

    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${editingRecipe.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRecipe(editingRecipe.id);
            if (onComplete) {
              onComplete();
            } else {
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  return {
    formData,
    modalStates,
    instructionSections,
    setInstructionSections,
    updateFormData,
    updateModalStates,
    setCookTimeFromMinutes,
    resetForm,
    handleSave,
    handleCancel,
    confirmCancel,
    handleDelete,
    isEditing: !!editingRecipe,
    reorderIngredients,
    reorderInstructions,
    moveCookingAction,
    isIngredientsReorderMode,
    setIsIngredientsReorderMode,
    isInstructionsReorderMode,
    setIsInstructionsReorderMode,
    isDraggingCookingAction,
    draggingCookingAction,
    handleCookingActionDragStart,
    handleCookingActionDragEnd,
    removeCookingAction
  };
};