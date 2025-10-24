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
import { haptics } from '@utils/haptics';

export interface UseRecipeFormProps {
  editingRecipe?: Recipe;
  onComplete?: () => void;
  previewMode?: boolean; // If true, don't save to database, just return the recipe
}

export const useRecipeForm = (props: UseRecipeFormProps = {}) => {
  const navigation = useNavigation();
  const { editingRecipe, onComplete = () => navigation?.goBack(), previewMode = false } = props;
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
  const [isSaving, setIsSaving] = useState(false);

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

    // Build step sections array from valid steps
    const stepSections = validSteps
      .map(step => step.stepSection)
      .filter((section): section is StepSection => section !== undefined);

    // Preview mode: Return the recipe without saving to database
    if (previewMode) {
      console.log('Preview mode: building recipe to return');

      const recipe: Recipe = {
        id: editingRecipe?.id || 'temp-preview-recipe',
        userId: user?.uid || '',
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
        published: false,
        status: 'Draft',
      };

      console.log('Preview mode: navigating back with edited recipe');

      // Get the previous route (MyFridgeRecipeDetail) from navigation state
      // @ts-ignore
      const state = navigation.getState();
      const previousRoute = state.routes[state.index - 1];

      if (previousRoute && previousRoute.name === 'MyFridgeRecipeDetail') {
        console.log('Found MyFridgeRecipeDetail route, setting params and going back');

        // First, dispatch setParams action to update the previous route's params
        // @ts-ignore
        navigation.dispatch({
          type: 'SET_PARAMS',
          payload: {
            params: {
              editedRecipe: recipe,
            },
          },
          source: previousRoute.key, // Target the previous route by its key
        });

        // Then go back to trigger the focus listener
        navigation.goBack();
      } else {
        console.log('Previous route not found, using goBack');
        navigation.goBack();
      }

      return;
    }

    // Normal mode: Save to database
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save a recipe.');
      return;
    }

    const published = formData.published || false;
    const recipe = {
      userId: user.uid,
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
      published,
      status: published ? 'Published' as const : 'Draft' as const,
    };

    // Show saving overlay
    setIsSaving(true);

    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, recipe, user.uid);
        setIsSaving(false);
        haptics.success();
        onComplete?.();
      } else {
        await addRecipe(recipe, user.uid);
        setIsSaving(false);
        haptics.success();
        // Navigate to My Recipes tab to show the newly created draft recipe
        // @ts-ignore - navigation types
        navigation.navigate('TabNavigator', { screen: 'MyRecipes' });
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      setIsSaving(false);
      haptics.error();
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
            haptics.heavy();
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
    isSaving,
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
