import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Recipe, useRecipeStore } from '../store/store';
import {
  RECIPE_DEFAULTS,
  RecipeFormState,
  RecipeModalState,
  getInitialFormState,
  getInitialModalState,
  hasFormData
} from '../constants/recipeDefaults';
import { CookingAction, InstructionSection } from '../types/chefiq';

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
    const hasData = hasFormData(formData);

    if (hasData && !editingRecipe) {
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
    resetForm();
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
    isEditing: !!editingRecipe
  };
};