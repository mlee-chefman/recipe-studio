import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CookingAction, StepSection } from '~/types/chefiq';
import { Step, migrateToSteps } from '~/types/recipe';

export type ViewMode = 'detailed' | 'compact' | 'grid';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: Step[]; // Array of step objects with text, image, and cookingAction
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tags?: string[]; // Multiple keywords for detailed searching
  image?: string;
  // ChefIQ Integration
  chefiqAppliance?: string; // appliance category_id
  stepSections?: StepSection[]; // grouped steps with cooking actions
  useProbe?: boolean; // whether to use thermometer probe (iQ MiniOven only)
}

export interface BearState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (newBears: number) => void;
}

export interface RecipeState {
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  searchQuery: string;
  selectedCategory: string;
  selectedDifficulty: string;
  selectedTags: string[];
  selectedAppliance: string;
  viewMode: ViewMode;
  selectionMode: boolean;
  setSearchQuery: (query: string) => void;
  setSelectionMode: (mode: boolean) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedDifficulty: (difficulty: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedAppliance: (appliance: string) => void;
  setViewMode: (mode: ViewMode) => void;
  filterRecipes: () => void;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  deleteRecipe: (id: string) => void;
  deleteRecipes: (ids: string[]) => void;
  updateRecipe: (id: string, recipe: Partial<Omit<Recipe, 'id'>>) => void;
  clearAllRecipes: () => void;
}

export const useStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}));

/**
 * Migrates a recipe from old format to new format
 * Converts separate instruction arrays to Step objects
 */
function migrateRecipe(recipe: any): Recipe {
  // Check if recipe has old format with "instructions" field
  if (recipe.instructions && Array.isArray(recipe.instructions)) {
    // Check if first instruction is a string (old format)
    if (typeof recipe.instructions[0] === 'string') {
      // Migrate from old format
      const migratedSteps = migrateToSteps(
        recipe.instructions,
        recipe.instructionImages,
        recipe.cookingActions
      );

      const { instructions, instructionImages, cookingActions, ...recipeWithoutLegacy } = recipe;

      return {
        ...recipeWithoutLegacy,
        steps: migratedSteps,
      };
    } else if (recipe.instructions[0] && typeof recipe.instructions[0] === 'object') {
      // Already migrated to objects, but field is called "instructions" instead of "steps"
      const { instructions, ...recipeWithoutInstructions } = recipe;
      return {
        ...recipeWithoutInstructions,
        steps: instructions,
      };
    }
  }

  // Already in new format with "steps" field
  return recipe;
}

// Sample recipe data
const sampleRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta dish with eggs, cheese, and pancetta',
    ingredients: ['400g spaghetti', '200g pancetta', '4 eggs', '100g parmesan', 'Black pepper'],
    steps: [
      { text: 'Boil pasta' },
      { text: 'Cook pancetta' },
      { text: 'Mix eggs and cheese' },
      { text: 'Combine all ingredients' },
    ],
    cookTime: 20,
    servings: 4,
    difficulty: 'Medium',
    category: 'Italian'
  },
  {
    id: '2',
    title: 'Chicken Stir Fry',
    description: 'Quick and healthy Asian-inspired dish',
    ingredients: ['500g chicken breast', 'Mixed vegetables', 'Soy sauce', 'Garlic', 'Ginger'],
    steps: [
      { text: 'Cut chicken' },
      { text: 'Heat oil' },
      { text: 'Stir fry chicken' },
      { text: 'Add vegetables' },
      { text: 'Season and serve' },
    ],
    cookTime: 15,
    servings: 3,
    difficulty: 'Easy',
    category: 'Asian'
  },
  {
    id: '3',
    title: 'Beef Wellington',
    description: 'Elegant beef dish wrapped in puff pastry',
    ingredients: ['1kg beef fillet', 'Puff pastry', 'Mushrooms', 'Prosciutto', 'Egg wash'],
    steps: [
      { text: 'Sear beef' },
      { text: 'Prepare mushroom duxelles' },
      { text: 'Wrap in pastry' },
      { text: 'Bake until golden' },
    ],
    cookTime: 90,
    servings: 6,
    difficulty: 'Hard',
    category: 'British'
  },
  {
    id: '4',
    title: 'Caesar Salad',
    description: 'Fresh romaine lettuce with classic Caesar dressing',
    ingredients: ['Romaine lettuce', 'Parmesan cheese', 'Croutons', 'Caesar dressing', 'Anchovies'],
    steps: [
      { text: 'Wash lettuce' },
      { text: 'Make dressing' },
      { text: 'Toss ingredients' },
      { text: 'Serve immediately' },
    ],
    cookTime: 10,
    servings: 2,
    difficulty: 'Easy',
    category: 'Salad'
  }
];

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: [],
      filteredRecipes: [],
      searchQuery: '',
      selectedCategory: '',
      selectedDifficulty: '',
      selectedTags: [],
      selectedAppliance: '',
      viewMode: 'detailed',
      selectionMode: false,
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().filterRecipes();
      },
      setSelectedCategory: (category: string) => {
        set({ selectedCategory: category });
        get().filterRecipes();
      },
      setSelectedDifficulty: (difficulty: string) => {
        set({ selectedDifficulty: difficulty });
        get().filterRecipes();
      },
      setSelectedTags: (tags: string[]) => {
        set({ selectedTags: tags });
        get().filterRecipes();
      },
      setSelectedAppliance: (appliance: string) => {
        set({ selectedAppliance: appliance });
        get().filterRecipes();
      },
      setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
      },
      setSelectionMode: (mode: boolean) => {
        set({ selectionMode: mode });
      },
      filterRecipes: () => {
        const { recipes, searchQuery, selectedCategory, selectedDifficulty, selectedTags, selectedAppliance } = get();
        let filtered = recipes;

        // Search query filter
        if (searchQuery) {
          filtered = filtered.filter(recipe => {
            const searchLower = searchQuery.toLowerCase();
            return (
              recipe.title.toLowerCase().includes(searchLower) ||
              recipe.description.toLowerCase().includes(searchLower) ||
              (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchLower)))
            );
          });
        }

        // Category filter
        if (selectedCategory) {
          filtered = filtered.filter(recipe => recipe.category === selectedCategory);
        }

        // Difficulty filter
        if (selectedDifficulty) {
          filtered = filtered.filter(recipe => recipe.difficulty === selectedDifficulty);
        }

        // Tags filter (recipe must have ALL selected tags)
        if (selectedTags.length > 0) {
          filtered = filtered.filter(recipe => {
            if (!recipe.tags || recipe.tags.length === 0) return false;
            return selectedTags.every(selectedTag =>
              recipe.tags!.some(recipeTag => recipeTag.toLowerCase() === selectedTag.toLowerCase())
            );
          });
        }

        // Appliance filter
        if (selectedAppliance) {
          filtered = filtered.filter(recipe => recipe.chefiqAppliance === selectedAppliance);
        }

        set({ filteredRecipes: filtered });
      },
      addRecipe: (recipe: Omit<Recipe, 'id'>) => {
        // Generate a unique ID using timestamp + random number to avoid collisions
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newRecipe: Recipe = {
          ...recipe,
          id: uniqueId,
        };
        const updatedRecipes = [...get().recipes, newRecipe];
        set({ recipes: updatedRecipes });
        get().filterRecipes();
      },
      deleteRecipe: (id: string) => {
        const updatedRecipes = get().recipes.filter(recipe => recipe.id !== id);
        set({ recipes: updatedRecipes });
        get().filterRecipes();
      },
      deleteRecipes: (ids: string[]) => {
        const idsSet = new Set(ids);
        const updatedRecipes = get().recipes.filter(recipe => !idsSet.has(recipe.id));
        set({ recipes: updatedRecipes });
        get().filterRecipes();
      },
      updateRecipe: (id: string, recipeUpdate: Partial<Omit<Recipe, 'id'>>) => {
        const updatedRecipes = get().recipes.map(recipe =>
          recipe.id === id ? { ...recipe, ...recipeUpdate } : recipe
        );
        set({ recipes: updatedRecipes });
        get().filterRecipes();
      },
      clearAllRecipes: () => {
        set({ recipes: [], filteredRecipes: [] });
      }
    }),
    {
      name: 'recipe-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recipes: state.recipes,
        viewMode: state.viewMode
      }),
      onRehydrateStorage: () => (state) => {
        // After loading from storage, migrate recipes and update filtered recipes
        if (state && state.recipes) {
          // Migrate all recipes from old format to new format
          const migratedRecipes = state.recipes.map(migrateRecipe);
          state.recipes = migratedRecipes;
          state.filterRecipes();
        }
      },
    }
  )
);
