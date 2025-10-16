import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CookingAction, InstructionSection } from '@types/chefiq';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tags?: string[]; // Multiple keywords for detailed searching
  image?: string;
  // ChefIQ Integration
  chefiqAppliance?: string; // appliance category_id
  instructionSections?: InstructionSection[]; // grouped instructions with cooking actions
  cookingActions?: CookingAction[]; // step-level cooking actions
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
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedDifficulty: (difficulty: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedAppliance: (appliance: string) => void;
  filterRecipes: () => void;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  deleteRecipe: (id: string) => void;
  updateRecipe: (id: string, recipe: Partial<Omit<Recipe, 'id'>>) => void;
  clearAllRecipes: () => void;
}

export const useStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}));

// Sample recipe data
const sampleRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta dish with eggs, cheese, and pancetta',
    ingredients: ['400g spaghetti', '200g pancetta', '4 eggs', '100g parmesan', 'Black pepper'],
    instructions: ['Boil pasta', 'Cook pancetta', 'Mix eggs and cheese', 'Combine all ingredients'],
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
    instructions: ['Cut chicken', 'Heat oil', 'Stir fry chicken', 'Add vegetables', 'Season and serve'],
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
    instructions: ['Sear beef', 'Prepare mushroom duxelles', 'Wrap in pastry', 'Bake until golden'],
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
    instructions: ['Wash lettuce', 'Make dressing', 'Toss ingredients', 'Serve immediately'],
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
        const newRecipe: Recipe = {
          ...recipe,
          id: Date.now().toString(),
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
        recipes: state.recipes
      }),
      onRehydrateStorage: () => (state) => {
        // After loading from storage, update filtered recipes
        if (state) {
          state.filterRecipes();
        }
      },
    }
  )
);
