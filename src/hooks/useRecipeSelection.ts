import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRecipeStore } from '@store/store';
import { Recipe } from '~/types/recipe';

interface UseRecipeSelectionOptions {
  selectionMode: boolean;
  filteredRecipes: Recipe[];
  userId?: string;
}

interface RecipeSelectionActions {
  selectedRecipeIds: Set<string>;
  toggleRecipeSelection: (recipeId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  deleteSelected: () => void;
  isSelected: (recipeId: string) => boolean;
}

/**
 * Custom hook to manage recipe selection state and actions
 */
export const useRecipeSelection = ({
  selectionMode,
  filteredRecipes,
  userId,
}: UseRecipeSelectionOptions): RecipeSelectionActions => {
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const { deleteRecipes, setSelectionMode } = useRecipeStore();

  // Clear selection when exiting selection mode
  useEffect(() => {
    if (!selectionMode) {
      setSelectedRecipeIds(new Set());
    }
  }, [selectionMode]);

  // Exit selection mode when there are no recipes
  useEffect(() => {
    if (selectionMode && filteredRecipes.length === 0) {
      setSelectionMode(false);
    }
  }, [selectionMode, filteredRecipes.length, setSelectionMode]);

  const toggleRecipeSelection = (recipeId: string) => {
    const newSelected = new Set(selectedRecipeIds);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipeIds(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredRecipes.map(r => r.id));
    setSelectedRecipeIds(allIds);
  };

  const deselectAll = () => {
    setSelectedRecipeIds(new Set());
  };

  const deleteSelected = () => {
    if (selectedRecipeIds.size === 0 || !userId) return;

    const count = selectedRecipeIds.size;
    Alert.alert(
      'Delete Recipes',
      `Are you sure you want to delete ${count} recipe${count > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRecipes(Array.from(selectedRecipeIds), userId);
            setSelectedRecipeIds(new Set());
          }
        }
      ]
    );
  };

  const isSelected = (recipeId: string): boolean => {
    return selectedRecipeIds.has(recipeId);
  };

  return {
    selectedRecipeIds,
    toggleRecipeSelection,
    selectAll,
    deselectAll,
    deleteSelected,
    isSelected,
  };
};
