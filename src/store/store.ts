import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CookingAction, InstructionSection } from '../types/chefiq';
import { AuthUser } from '../modules/user/userAuth';
import { UserProfile } from '../modules/user/userService';
import { 
  createRecipe, 
  getRecipes, 
  updateRecipe as updateRecipeService, 
  deleteRecipe as deleteRecipeService,
  Recipe as FirebaseRecipe,
  CreateRecipeData 
} from '../modules/recipe/recipeService';

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

export interface AuthState {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export interface RecipeState {
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  isLoading: boolean;
  error: string | null;
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
  fetchRecipes: (userId: string) => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id'>, userId: string) => Promise<void>;
  deleteRecipe: (id: string, userId: string) => Promise<void>;
  updateRecipe: (id: string, recipe: Partial<Omit<Recipe, 'id'>>, userId: string) => Promise<void>;
}

export const useStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}));

// Auth store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      userProfile: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: (user: AuthUser | null) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false 
        });
      },
      setUserProfile: (profile: UserProfile | null) => {
        set({ userProfile: profile });
      },
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      signOut: () => {
        set({ 
          user: null, 
          userProfile: null, 
          isAuthenticated: false,
          isLoading: false 
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        userProfile: state.userProfile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  filteredRecipes: [],
  isLoading: false,
  error: null,
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
  fetchRecipes: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const firebaseRecipes = await getRecipes(userId);
      
      // Convert Firebase recipes to store Recipe format
      const recipes: Recipe[] = firebaseRecipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty as 'Easy' | 'Medium' | 'Hard',
        category: recipe.category,
        tags: recipe.tags,
        image: recipe.image,
        chefiqAppliance: recipe.chefiqAppliance,
        instructionSections: recipe.instructionSections,
        cookingActions: recipe.cookingActions,
        useProbe: recipe.useProbe,
      }));
      
      set({ recipes, isLoading: false });
      get().filterRecipes();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch recipes',
        isLoading: false 
      });
    }
  },
  addRecipe: async (recipe: Omit<Recipe, 'id'>, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Create recipe data for Firebase
      const createData: CreateRecipeData = {
        userId,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        category: recipe.category,
        tags: recipe.tags,
        image: recipe.image,
        chefiqAppliance: recipe.chefiqAppliance,
        instructionSections: recipe.instructionSections,
        cookingActions: recipe.cookingActions,
        useProbe: recipe.useProbe,
      };
      
      await createRecipe(createData);
      
      // Refetch recipes to ensure store is up-to-date
      await get().fetchRecipes(userId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add recipe',
        isLoading: false 
      });
    }
  },
  deleteRecipe: async (id: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      await deleteRecipeService(id);
      
      // Refetch recipes to ensure store is up-to-date
      await get().fetchRecipes(userId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete recipe',
        isLoading: false 
      });
    }
  },
  updateRecipe: async (id: string, recipe: Partial<Omit<Recipe, 'id'>>, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      await updateRecipeService(id, recipe);
      
      // Refetch recipes to ensure store is up-to-date
      await get().fetchRecipes(userId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update recipe',
        isLoading: false 
      });
    }
  },
}));
