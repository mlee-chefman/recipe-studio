import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateToSteps, Recipe } from '~/types/recipe';
import { AuthUser } from '../modules/user/userAuth';
import { UserProfile } from '../modules/user/userService';
import {
  createRecipe,
  getRecipes,
  getRecipesByUserId,
  updateRecipe as updateRecipeService,
  deleteRecipe as deleteRecipeService,
  CreateRecipeData,
  Recipe as FirebaseRecipe
} from '../modules/recipe/recipeService';

export type ViewMode = 'detailed' | 'compact' | 'grid';

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
  // Home tab recipes (all published recipes)
  allRecipes: Recipe[];
  filteredAllRecipes: Recipe[];
  // MyRecipes tab recipes (user's own recipes)
  userRecipes: Recipe[];
  filteredUserRecipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  // Search and filter state for Home tab
  allRecipesSearchQuery: string;
  allRecipesSelectedCategory: string;
  allRecipesSelectedDifficulty: string;
  allRecipesSelectedTags: string[];
  allRecipesSelectedAppliance: string;
  allRecipesViewMode: ViewMode;
  // Search and filter state for MyRecipes tab
  userRecipesSearchQuery: string;
  userRecipesSelectedCategory: string;
  userRecipesSelectedDifficulty: string;
  userRecipesSelectedTags: string[];
  userRecipesSelectedAppliance: string;
  userRecipesViewMode: ViewMode;
  selectionMode: boolean;
  // Actions for Home tab
  setAllRecipesSearchQuery: (query: string) => void;
  setAllRecipesSelectedCategory: (category: string) => void;
  setAllRecipesSelectedDifficulty: (difficulty: string) => void;
  setAllRecipesSelectedTags: (tags: string[]) => void;
  setAllRecipesSelectedAppliance: (appliance: string) => void;
  setAllRecipesViewMode: (mode: ViewMode) => void;
  filterAllRecipes: () => void;
  // Actions for MyRecipes tab
  setUserRecipesSearchQuery: (query: string) => void;
  setUserRecipesSelectedCategory: (category: string) => void;
  setUserRecipesSelectedDifficulty: (difficulty: string) => void;
  setUserRecipesSelectedTags: (tags: string[]) => void;
  setUserRecipesSelectedAppliance: (appliance: string) => void;
  setUserRecipesViewMode: (mode: ViewMode) => void;
  setSelectionMode: (mode: boolean) => void;
  filterUserRecipes: () => void;
  // Data fetching
  fetchRecipes: (userId: string) => Promise<void>;
  fetchUserRecipes: (userId: string) => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id'>, userId: string) => Promise<void>;
  deleteRecipe: (id: string, userId: string) => Promise<void>;
  deleteRecipes: (ids: string[], userId: string) => Promise<void>;
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
  // Home tab recipes (all published recipes)
  allRecipes: [],
  filteredAllRecipes: [],
  // MyRecipes tab recipes (user's own recipes)
  userRecipes: [],
  filteredUserRecipes: [],
  isLoading: false,
  error: null,
  // Search and filter state for Home tab
  allRecipesSearchQuery: '',
  allRecipesSelectedCategory: '',
  allRecipesSelectedDifficulty: '',
  allRecipesSelectedTags: [],
  allRecipesSelectedAppliance: '',
  // Search and filter state for MyRecipes tab
  userRecipesSearchQuery: '',
  userRecipesSelectedCategory: '',
  userRecipesSelectedDifficulty: '',
  userRecipesSelectedTags: [],
  userRecipesSelectedAppliance: '',
  // View mode for both tabs
  allRecipesViewMode: 'detailed' as ViewMode,
  userRecipesViewMode: 'detailed' as ViewMode,
  selectionMode: false,
  // Actions for Home tab
  setAllRecipesSearchQuery: (query: string) => {
    set({ allRecipesSearchQuery: query });
    get().filterAllRecipes();
  },
  setAllRecipesSelectedCategory: (category: string) => {
    set({ allRecipesSelectedCategory: category });
    get().filterAllRecipes();
  },
  setAllRecipesSelectedDifficulty: (difficulty: string) => {
    set({ allRecipesSelectedDifficulty: difficulty });
    get().filterAllRecipes();
  },
  setAllRecipesSelectedTags: (tags: string[]) => {
    set({ allRecipesSelectedTags: tags });
    get().filterAllRecipes();
  },
  setAllRecipesSelectedAppliance: (appliance: string) => {
    set({ allRecipesSelectedAppliance: appliance });
    get().filterAllRecipes();
  },
  filterAllRecipes: () => {
    const { 
      allRecipes, 
      allRecipesSearchQuery, 
      allRecipesSelectedCategory, 
      allRecipesSelectedDifficulty, 
      allRecipesSelectedTags, 
      allRecipesSelectedAppliance 
    } = get();
    let filtered = allRecipes;

    // Search query filter
    if (allRecipesSearchQuery) {
      filtered = filtered.filter((recipe: Recipe) => {
        const searchLower = allRecipesSearchQuery.toLowerCase();
        return (
          recipe.title.toLowerCase().includes(searchLower) ||
          recipe.description.toLowerCase().includes(searchLower) ||
          (recipe.tags && recipe.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
        );
      });
    }

    // Category filter
    if (allRecipesSelectedCategory) {
      filtered = filtered.filter((recipe: Recipe) => recipe.category === allRecipesSelectedCategory);
    }

    // Difficulty filter
    if (allRecipesSelectedDifficulty) {
      filtered = filtered.filter((recipe: Recipe) => recipe.difficulty === allRecipesSelectedDifficulty);
    }

    // Tags filter (recipe must have ALL selected tags)
    if (allRecipesSelectedTags.length > 0) {
      filtered = filtered.filter((recipe: Recipe) => {
        if (!recipe.tags || recipe.tags.length === 0) return false;
        return allRecipesSelectedTags.every((selectedTag: string) =>
          recipe.tags!.some((recipeTag: string) => recipeTag.toLowerCase() === selectedTag.toLowerCase())
        );
      });
    }

    // Appliance filter
    if (allRecipesSelectedAppliance) {
      filtered = filtered.filter((recipe: Recipe) => recipe.chefiqAppliance === allRecipesSelectedAppliance);
    }

    set({ filteredAllRecipes: filtered });
  },
  // Actions for MyRecipes tab
  setUserRecipesSearchQuery: (query: string) => {
    set({ userRecipesSearchQuery: query });
    get().filterUserRecipes();
  },
  setUserRecipesSelectedCategory: (category: string) => {
    set({ userRecipesSelectedCategory: category });
    get().filterUserRecipes();
  },
  setUserRecipesSelectedDifficulty: (difficulty: string) => {
    set({ userRecipesSelectedDifficulty: difficulty });
    get().filterUserRecipes();
  },
  setUserRecipesSelectedTags: (tags: string[]) => {
    set({ userRecipesSelectedTags: tags });
    get().filterUserRecipes();
  },
  setUserRecipesSelectedAppliance: (appliance: string) => {
    set({ userRecipesSelectedAppliance: appliance });
    get().filterUserRecipes();
  },
  filterUserRecipes: () => {
    const { 
      userRecipes, 
      userRecipesSearchQuery, 
      userRecipesSelectedCategory, 
      userRecipesSelectedDifficulty, 
      userRecipesSelectedTags, 
      userRecipesSelectedAppliance 
    } = get();
    let filtered = userRecipes;

    // Search query filter
    if (userRecipesSearchQuery) {
      filtered = filtered.filter((recipe: Recipe) => {
        const searchLower = userRecipesSearchQuery.toLowerCase();
        return (
          recipe.title.toLowerCase().includes(searchLower) ||
          recipe.description.toLowerCase().includes(searchLower) ||
          (recipe.tags && recipe.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
        );
      });
    }

    // Category filter
    if (userRecipesSelectedCategory) {
      filtered = filtered.filter((recipe: Recipe) => recipe.category === userRecipesSelectedCategory);
    }

    // Difficulty filter
    if (userRecipesSelectedDifficulty) {
      filtered = filtered.filter((recipe: Recipe) => recipe.difficulty === userRecipesSelectedDifficulty);
    }

    // Tags filter (recipe must have ALL selected tags)
    if (userRecipesSelectedTags.length > 0) {
      filtered = filtered.filter((recipe: Recipe) => {
        if (!recipe.tags || recipe.tags.length === 0) return false;
        return userRecipesSelectedTags.every((selectedTag: string) =>
          recipe.tags!.some((recipeTag: string) => recipeTag.toLowerCase() === selectedTag.toLowerCase())
        );
      });
    }

    // Appliance filter
    if (userRecipesSelectedAppliance) {
      filtered = filtered.filter((recipe: Recipe) => recipe.chefiqAppliance === userRecipesSelectedAppliance);
    }

    set({ filteredUserRecipes: filtered });
  },
  // View mode actions
  setAllRecipesViewMode: (mode: ViewMode) => {
    set({ allRecipesViewMode: mode });
  },
  setUserRecipesViewMode: (mode: ViewMode) => {
    set({ userRecipesViewMode: mode });
  },
  setSelectionMode: (mode: boolean) => {
    set({ selectionMode: mode });
  },
  // Data fetching
  fetchRecipes: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const firebaseRecipes = await getRecipes(userId);

      // Convert Firebase recipes to store Recipe format
      const recipes: Recipe[] = firebaseRecipes.map((recipe: FirebaseRecipe) => {
        // Migrate old format to new format if needed
        const steps = (recipe as any).steps
          ? (recipe as any).steps
          : migrateToSteps(
              (recipe as any).instructions || [],
              (recipe as any).instructionImages,
              (recipe as any).cookingActions
            );

        return {
          id: recipe.id,
          userId: recipe.userId,
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          steps: steps,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty as 'Easy' | 'Medium' | 'Hard',
          category: recipe.category,
          tags: recipe.tags,
          image: recipe.image,
          chefiqAppliance: recipe.chefiqAppliance,
          stepSections: (recipe as any).stepSections || (recipe as any).instructionSections,
          useProbe: recipe.useProbe,
          published: recipe.published,
          status: recipe.published ? 'Published' : 'Draft',
        };
      });

      set({ allRecipes: recipes, isLoading: false });
      get().filterAllRecipes();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch recipes',
        isLoading: false
      });
    }
  },
  fetchUserRecipes: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const firebaseRecipes = await getRecipesByUserId(userId);

      // Convert Firebase recipes to store Recipe format
      const recipes: Recipe[] = firebaseRecipes.map((recipe: FirebaseRecipe) => {
        // Migrate old format to new format if needed
        const steps = (recipe as any).steps
          ? (recipe as any).steps
          : migrateToSteps(
              (recipe as any).instructions || [],
              (recipe as any).instructionImages,
              (recipe as any).cookingActions
            );

        return {
          id: recipe.id,
          userId: recipe.userId,
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          steps: steps,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty as 'Easy' | 'Medium' | 'Hard',
          category: recipe.category,
          tags: recipe.tags,
          image: recipe.image,
          chefiqAppliance: recipe.chefiqAppliance,
          stepSections: (recipe as any).stepSections || (recipe as any).instructionSections,
          useProbe: recipe.useProbe,
          published: recipe.published,
          status: recipe.published ? 'Published' : 'Draft',
        };
      });

      set({ userRecipes: recipes, isLoading: false });
      get().filterUserRecipes();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user recipes',
        isLoading: false
      });
    }
  },
  addRecipe: async (recipe: Omit<Recipe, 'id'>, userId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Create recipe data for Firebase - only include defined fields
      const createData: any = {
        userId,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        category: recipe.category,
        published: recipe.published || false,
      };

      // Only add optional fields if they're defined and not empty
      if (recipe.tags && recipe.tags.length > 0) {
        createData.tags = recipe.tags;
      }
      if (recipe.image) {
        createData.image = recipe.image;
      }
      if (recipe.chefiqAppliance) {
        createData.chefiqAppliance = recipe.chefiqAppliance;
      }
      if (recipe.stepSections && recipe.stepSections.length > 0) {
        createData.stepSections = recipe.stepSections;
      }
      if (recipe.useProbe !== undefined) {
        createData.useProbe = recipe.useProbe;
      }

      await createRecipe(createData);

      // Refetch both recipe lists to ensure store is up-to-date
      await get().fetchRecipes(userId);
      await get().fetchUserRecipes(userId);

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add recipe';
      set({
        error: errorMessage,
        isLoading: false
      });
      // Re-throw the error so it can be caught in the UI
      throw new Error(errorMessage);
    }
  },
  deleteRecipe: async (id: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      await deleteRecipeService(id, userId);

      // Refetch both recipe lists to ensure store is up-to-date
      await get().fetchRecipes(userId);
      await get().fetchUserRecipes(userId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete recipe',
        isLoading: false
      });
    }
  },
  deleteRecipes: async (ids: string[], userId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Delete all recipes in parallel
      await Promise.all(ids.map(id => deleteRecipeService(id, userId)));

      // Refetch both recipe lists to ensure store is up-to-date
      await get().fetchRecipes(userId);
      await get().fetchUserRecipes(userId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete recipes',
        isLoading: false
      });
    }
  },
  updateRecipe: async (id: string, recipe: Partial<Omit<Recipe, 'id'>>, userId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Filter out undefined values before updating
      const updateData: any = {};
      Object.keys(recipe).forEach(key => {
        const value = (recipe as any)[key];
        if (value !== undefined) {
          updateData[key] = value;
        }
      });

      await updateRecipeService(id, updateData, userId);

      // Refetch both recipe lists to ensure store is up-to-date
      await get().fetchRecipes(userId);
      await get().fetchUserRecipes(userId);

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update recipe';
      set({
        error: errorMessage,
        isLoading: false
      });
      // Re-throw the error so it can be caught in the UI
      throw new Error(errorMessage);
    }
  },
}));
