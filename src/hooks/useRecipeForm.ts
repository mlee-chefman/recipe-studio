import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation, StackActions } from '@react-navigation/native';
import { useRecipeStore, useAuthStore } from '@store/store';
import { Recipe } from '~/types/recipe';
import {
  RECIPE_DEFAULTS,
  RecipeFormState,
  RecipeModalState,
  getInitialFormState,
  getInitialModalState,
  hasFormData,
  hasFormChanges
} from '@constants/recipeDefaults';
import { CookingAction, StepSection } from '~/types/chefiq';

export interface UseRecipeFormProps {
  editingRecipe?: Recipe;
  onComplete?: () => void;
}

export const useRecipeForm = (props: UseRecipeFormProps = {}) => {
  const navigation = useNavigation();
  const { editingRecipe, onComplete = () => navigation?.goBack() } = props;
  const { addRecipe, updateRecipe, deleteRecipe } = useRecipeStore();
  const { user } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState<RecipeFormState>(getInitialFormState());
  const [modalStates, setModalStates] = useState<RecipeModalState>(getInitialModalState());
  const [stepSections, setStepSections] = useState<StepSection[]>([]);
  const [isIngredientsReorderMode, setIsIngredientsReorderMode] = useState(false);
  const [isStepsReorderMode, setIsStepsReorderMode] = useState(false);
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

  const reorderSteps = (newSteps: any[]) => {
    // Steps are now Step objects, they maintain their own cooking actions
    updateFormData({
      steps: newSteps
    });
  };

  const moveCookingAction = (fromStepIndex: number, toStepIndex: number) => {
    const fromAction = formData.steps[fromStepIndex]?.cookingAction;
    if (fromAction) {
      const newSteps = [...formData.steps];
      // Remove from source
      newSteps[fromStepIndex] = {
        ...newSteps[fromStepIndex],
        cookingAction: undefined,
      };
      // Add to target (removing any existing action there)
      newSteps[toStepIndex] = {
        ...newSteps[toStepIndex],
        cookingAction: fromAction,
      };
      updateFormData({ steps: newSteps });
    }
  };

  // Cooking Action Drag and Drop handlers
  const handleCookingActionDragStart = (fromStepIndex: number) => {
    const action = formData.steps[fromStepIndex]?.cookingAction;
    if (action) {
      setDraggingCookingAction({ action, fromStepIndex });
      setIsDraggingCookingAction(true);
    }
  };

  const handleCookingActionDragEnd = (fromStepIndex: number, toStepIndex: number) => {
    console.log('Drag end:', { fromStepIndex, toStepIndex, totalSteps: formData.steps.length });

    // Ensure target step is valid
    const maxStepIndex = Math.max(0, formData.steps.length - 1);
    const validToStepIndex = Math.min(Math.max(0, toStepIndex), maxStepIndex);

    if (fromStepIndex !== validToStepIndex) {
      const action = formData.steps[fromStepIndex]?.cookingAction;

      if (action) {
        console.log('Moving action from step', fromStepIndex, 'to step', validToStepIndex);

        const newSteps = [...formData.steps];
        // Remove from source
        newSteps[fromStepIndex] = {
          ...newSteps[fromStepIndex],
          cookingAction: undefined,
        };
        // Add to target (replacing any existing action)
        newSteps[validToStepIndex] = {
          ...newSteps[validToStepIndex],
          cookingAction: action,
        };

        updateFormData({ steps: newSteps });
      }
    }

    setIsDraggingCookingAction(false);
    setDraggingCookingAction(null);
  };

  const removeCookingAction = (stepIndex: number) => {
    const newSteps = [...formData.steps];
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      cookingAction: undefined,
    };
    updateFormData({ steps: newSteps });
  };

  const resetForm = () => {
    setFormData(getInitialFormState());
    setModalStates(getInitialModalState());
    setStepSections([]);
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
        steps: editingRecipe.steps.length > 0 ? editingRecipe.steps : [{ text: '' }],
        notes: editingRecipe.description,
        selectedAppliance: editingRecipe.chefiqAppliance || '',
        useProbe: editingRecipe.useProbe || false,
        published: editingRecipe.published || false
      });
      setStepSections(editingRecipe.stepSections || []);
    }
  }, [editingRecipe]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save a recipe.');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('Error', 'Recipe title is required');
      return;
    }

    const validIngredients = formData.ingredients.filter(i => i.trim() !== '');
    if (validIngredients.length === 0) {
      Alert.alert('Error', 'At least one ingredient is required');
      return;
    }

    const validSteps = formData.steps.filter(s => s.text.trim() !== '');
    if (validSteps.length === 0) {
      Alert.alert('Error', 'At least one step is required');
      return;
    }

    const recipe = {
      title: formData.title.trim(),
      description: formData.notes.trim() || 'No description provided',
      ingredients: validIngredients,
      steps: validSteps,
      cookTime: formData.cookTime,
      servings: formData.servings,
      difficulty: formData.difficulty,
      category: formData.category.trim() || 'Uncategorized',
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      image: formData.imageUrl.trim() || undefined,
      chefiqAppliance: formData.selectedAppliance || undefined,
      stepSections: stepSections.length > 0 ? stepSections : undefined,
      useProbe: formData.useProbe || undefined,
      published: formData.published || false,
    };

    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, recipe, user.uid);
        const publishStatus = formData.published ? 'published' : 'saved as draft';
        Alert.alert('Success', `Recipe updated and ${publishStatus}!`, [
          { text: 'OK', onPress: onComplete }
        ]);
      } else {
        await addRecipe(recipe, user.uid);
        const publishStatus = formData.published ? 'created and published' : 'created as draft';
        Alert.alert('Success', `Recipe ${publishStatus}!`, [
          {
            text: 'OK',
            onPress: onComplete
          }
        ]);
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      const action = editingRecipe ? 'updating' : 'creating';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Error',
        `Failed to ${action} recipe: ${errorMessage}. Please try again.`,
        [{ text: 'OK' }]
      );
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
        onComplete?.();
    }
  };

  const confirmCancel = () => {
    updateModalStates({ showCancelConfirmation: false });
    if (!editingRecipe) {
      resetForm();
    }
    onComplete?.();
  };

  const handleDelete = () => {
    if (!editingRecipe || !user) return;

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
            deleteRecipe(editingRecipe.id, user.uid);
            navigation?.dispatch(StackActions.popToTop());
          }
        }
      ]
    );
  };

  return {
    formData,
    modalStates,
    stepSections,
    setStepSections,
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
    reorderSteps,
    moveCookingAction,
    isIngredientsReorderMode,
    setIsIngredientsReorderMode,
    isStepsReorderMode,
    setIsStepsReorderMode,
    isDraggingCookingAction,
    draggingCookingAction,
    handleCookingActionDragStart,
    handleCookingActionDragEnd,
    removeCookingAction
  };
};
