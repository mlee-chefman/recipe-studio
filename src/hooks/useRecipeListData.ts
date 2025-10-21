import { useRecipeStore } from '@store/store';
import { Recipe } from '~/types/recipe';

type TabType = 'home' | 'myRecipes';
type ViewMode = 'detailed' | 'compact' | 'grid';

interface RecipeListData {
  // Recipes
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  isLoading: boolean;

  // Search and filters
  searchQuery: string;
  selectedCategory: string;
  selectedDifficulty: string;
  selectedTags: string[];
  selectedAppliance: string;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedDifficulty: (difficulty: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedAppliance: (appliance: string) => void;
  filterRecipes: () => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Selection mode (only for myRecipes)
  selectionMode: boolean;
}

/**
 * Custom hook to manage recipe list data based on tab type
 * Abstracts the complexity of selecting the right state and actions from the store
 */
export const useRecipeListData = (tabType: TabType): RecipeListData => {
  const recipeStore = useRecipeStore();
  const isHomeTab = tabType === 'home';

  // Select the appropriate state based on tab type
  const recipes = isHomeTab ? recipeStore.allRecipes : recipeStore.userRecipes;
  const filteredRecipes = isHomeTab ? recipeStore.filteredAllRecipes : recipeStore.filteredUserRecipes;
  const searchQuery = isHomeTab ? recipeStore.allRecipesSearchQuery : recipeStore.userRecipesSearchQuery;
  const selectedCategory = isHomeTab ? recipeStore.allRecipesSelectedCategory : recipeStore.userRecipesSelectedCategory;
  const selectedDifficulty = isHomeTab ? recipeStore.allRecipesSelectedDifficulty : recipeStore.userRecipesSelectedDifficulty;
  const selectedTags = isHomeTab ? recipeStore.allRecipesSelectedTags : recipeStore.userRecipesSelectedTags;
  const selectedAppliance = isHomeTab ? recipeStore.allRecipesSelectedAppliance : recipeStore.userRecipesSelectedAppliance;
  const viewMode = isHomeTab ? recipeStore.allRecipesViewMode : recipeStore.userRecipesViewMode;

  // Select the appropriate actions based on tab type
  const setSearchQuery = isHomeTab ? recipeStore.setAllRecipesSearchQuery : recipeStore.setUserRecipesSearchQuery;
  const setSelectedCategory = isHomeTab ? recipeStore.setAllRecipesSelectedCategory : recipeStore.setUserRecipesSelectedCategory;
  const setSelectedDifficulty = isHomeTab ? recipeStore.setAllRecipesSelectedDifficulty : recipeStore.setUserRecipesSelectedDifficulty;
  const setSelectedTags = isHomeTab ? recipeStore.setAllRecipesSelectedTags : recipeStore.setUserRecipesSelectedTags;
  const setSelectedAppliance = isHomeTab ? recipeStore.setAllRecipesSelectedAppliance : recipeStore.setUserRecipesSelectedAppliance;
  const setViewMode = isHomeTab ? recipeStore.setAllRecipesViewMode : recipeStore.setUserRecipesViewMode;
  const filterRecipes = isHomeTab ? recipeStore.filterAllRecipes : recipeStore.filterUserRecipes;

  // Selection mode is only available for myRecipes tab
  const selectionMode = isHomeTab ? false : recipeStore.selectionMode;

  return {
    recipes,
    filteredRecipes,
    isLoading: recipeStore.isLoading,
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    selectedTags,
    selectedAppliance,
    setSearchQuery,
    setSelectedCategory,
    setSelectedDifficulty,
    setSelectedTags,
    setSelectedAppliance,
    filterRecipes,
    viewMode,
    setViewMode,
    selectionMode,
  };
};
