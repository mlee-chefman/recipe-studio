import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateToSteps, Recipe } from '~/types/recipe';
import { AuthUser } from '../modules/user/userAuth';
import { UserProfile } from '../modules/user/userService';
import {
  createRecipe,
  createRecipesBatch,
  getRecipes,
  getRecipesByUserId,
  updateRecipe as updateRecipeService,
  deleteRecipe as deleteRecipeService,
  deleteRecipesBatch,
  enrichRecipesWithAuthorNames,
  CreateRecipeData,
  Recipe as FirebaseRecipe
} from '../modules/recipe/recipeService';
import { ThemeVariant } from '@theme/variants';
import {
  FridgeIngredient,
  FridgePreferences,
  DietaryPreference,
  CuisinePreference,
  CookingTimePreference,
  CategoryPreference,
  MatchingStrictness,
  RecipeSource,
} from '~/types/ingredient';
import { CartItem, GroceryCart } from '~/types/shopping';

export type ViewMode = 'detailed' | 'compact' | 'grid';
export type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'cooktime-asc' | 'cooktime-desc';

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
  allRecipesSortOption: SortOption;
  // Search and filter state for MyRecipes tab
  userRecipesSearchQuery: string;
  userRecipesSelectedCategory: string;
  userRecipesSelectedDifficulty: string;
  userRecipesSelectedTags: string[];
  userRecipesSelectedAppliance: string;
  userRecipesViewMode: ViewMode;
  userRecipesSortOption: SortOption;
  selectionMode: boolean;
  // Actions for Home tab
  setAllRecipesSearchQuery: (query: string) => void;
  setAllRecipesSelectedCategory: (category: string) => void;
  setAllRecipesSelectedDifficulty: (difficulty: string) => void;
  setAllRecipesSelectedTags: (tags: string[]) => void;
  setAllRecipesSelectedAppliance: (appliance: string) => void;
  setAllRecipesViewMode: (mode: ViewMode) => void;
  setAllRecipesSortOption: (option: SortOption) => void;
  filterAllRecipes: () => void;
  // Actions for MyRecipes tab
  setUserRecipesSearchQuery: (query: string) => void;
  setUserRecipesSelectedCategory: (category: string) => void;
  setUserRecipesSelectedDifficulty: (difficulty: string) => void;
  setUserRecipesSelectedTags: (tags: string[]) => void;
  setUserRecipesSelectedAppliance: (appliance: string) => void;
  setUserRecipesViewMode: (mode: ViewMode) => void;
  setUserRecipesSortOption: (option: SortOption) => void;
  setSelectionMode: (mode: boolean) => void;
  filterUserRecipes: () => void;
  // Data fetching
  fetchRecipes: (userId: string) => Promise<void>;
  fetchUserRecipes: (userId: string) => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id'>, userId: string) => Promise<void>;
  addRecipesBatch: (recipes: Omit<Recipe, 'id'>[], userId: string) => Promise<void>;
  deleteRecipe: (id: string, userId: string) => Promise<void>;
  deleteRecipes: (ids: string[], userId: string) => Promise<void>;
  updateRecipe: (id: string, recipe: Partial<Omit<Recipe, 'id'>>, userId: string) => Promise<void>;
}

export interface ThemeState {
  themeVariant: ThemeVariant;
  setThemeVariant: (variant: ThemeVariant) => void;
}

export interface FridgeState {
  // Ingredients in user's fridge
  ingredients: FridgeIngredient[];
  // User preferences for recipe generation
  preferences: FridgePreferences;
  // Track generated recipe titles to avoid duplicates
  generatedRecipeTitles: string[];
  // Temporary holder for updated recipe from detail screen
  pendingRecipeUpdate: { recipe: any; index: number } | null;
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  // Actions for managing ingredients
  addIngredient: (ingredient: FridgeIngredient) => void;
  removeIngredient: (id: string) => void;
  clearIngredients: () => void;
  // Actions for managing preferences
  setDietaryPreference: (dietary: DietaryPreference) => void;
  setCuisinePreference: (cuisine: CuisinePreference) => void;
  setCookingTimePreference: (time: CookingTimePreference) => void;
  setCategoryPreference: (category: CategoryPreference) => void;
  setMatchingStrictness: (strictness: MatchingStrictness) => void;
  setRecipeSource: (source: RecipeSource) => void;
  // Reset all preferences to default
  resetPreferences: () => void;
  // Actions for tracking generated recipes
  addGeneratedRecipeTitle: (title: string) => void;
  clearGeneratedRecipeTitles: () => void;
  // Actions for pending recipe updates
  setPendingRecipeUpdate: (update: { recipe: any; index: number } | null) => void;
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
  allRecipesViewMode: 'grid' as ViewMode,
  userRecipesViewMode: 'detailed' as ViewMode,
  // Sort options for both tabs (default to newest first)
  allRecipesSortOption: 'newest' as SortOption,
  userRecipesSortOption: 'newest' as SortOption,
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
      allRecipesSelectedAppliance,
      allRecipesSortOption
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

    // Apply sorting - create a new array to ensure React detects the change
    filtered = [...filtered].sort((a: Recipe, b: Recipe) => {
      switch (allRecipesSortOption) {
        case 'newest': {
          // Use createdAt, fallback to updatedAt if createdAt is missing
          const dateRawA = a.createdAt || a.updatedAt;
          const dateRawB = b.createdAt || b.updatedAt;

          // Handle missing timestamps - put recipes without dates at the end
          if (!dateRawA && !dateRawB) return 0;
          if (!dateRawA) return 1;
          if (!dateRawB) return -1;

          const dateA = typeof dateRawA === 'string' ? new Date(dateRawA) : dateRawA;
          const dateB = typeof dateRawB === 'string' ? new Date(dateRawB) : dateRawB;
          return dateB.getTime() - dateA.getTime();
        }
        case 'oldest': {
          // Use createdAt, fallback to updatedAt if createdAt is missing
          const dateRawA = a.createdAt || a.updatedAt;
          const dateRawB = b.createdAt || b.updatedAt;

          // Handle missing timestamps - put recipes without dates at the end
          if (!dateRawA && !dateRawB) return 0;
          if (!dateRawA) return 1;
          if (!dateRawB) return -1;

          const dateA = typeof dateRawA === 'string' ? new Date(dateRawA) : dateRawA;
          const dateB = typeof dateRawB === 'string' ? new Date(dateRawB) : dateRawB;
          return dateA.getTime() - dateB.getTime();
        }
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'cooktime-asc':
          return (a.cookTime || 0) - (b.cookTime || 0);
        case 'cooktime-desc':
          return (b.cookTime || 0) - (a.cookTime || 0);
        default:
          return 0;
      }
    });

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
      userRecipesSelectedAppliance,
      userRecipesSortOption
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

    // Apply sorting - create a new array to ensure React detects the change
    filtered = [...filtered].sort((a: Recipe, b: Recipe) => {
      switch (userRecipesSortOption) {
        case 'newest': {
          // Use createdAt, fallback to updatedAt if createdAt is missing
          const dateRawA = a.createdAt || a.updatedAt;
          const dateRawB = b.createdAt || b.updatedAt;

          // Handle missing timestamps - put recipes without dates at the end
          if (!dateRawA && !dateRawB) return 0;
          if (!dateRawA) return 1;
          if (!dateRawB) return -1;

          const dateA = typeof dateRawA === 'string' ? new Date(dateRawA) : dateRawA;
          const dateB = typeof dateRawB === 'string' ? new Date(dateRawB) : dateRawB;
          return dateB.getTime() - dateA.getTime();
        }
        case 'oldest': {
          // Use createdAt, fallback to updatedAt if createdAt is missing
          const dateRawA = a.createdAt || a.updatedAt;
          const dateRawB = b.createdAt || b.updatedAt;

          // Handle missing timestamps - put recipes without dates at the end
          if (!dateRawA && !dateRawB) return 0;
          if (!dateRawA) return 1;
          if (!dateRawB) return -1;

          const dateA = typeof dateRawA === 'string' ? new Date(dateRawA) : dateRawA;
          const dateB = typeof dateRawB === 'string' ? new Date(dateRawB) : dateRawB;
          return dateA.getTime() - dateB.getTime();
        }
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'cooktime-asc':
          return (a.cookTime || 0) - (b.cookTime || 0);
        case 'cooktime-desc':
          return (b.cookTime || 0) - (a.cookTime || 0);
        default:
          return 0;
      }
    });

    set({ filteredUserRecipes: filtered });
  },
  // View mode actions
  setAllRecipesViewMode: (mode: ViewMode) => {
    set({ allRecipesViewMode: mode });
  },
  setUserRecipesViewMode: (mode: ViewMode) => {
    set({ userRecipesViewMode: mode });
  },
  // Sort option actions
  setAllRecipesSortOption: (option: SortOption) => {
    set({ allRecipesSortOption: option });
    get().filterAllRecipes();
  },
  setUserRecipesSortOption: (option: SortOption) => {
    set({ userRecipesSortOption: option });
    get().filterUserRecipes();
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
      let recipes: Recipe[] = firebaseRecipes.map((recipe: FirebaseRecipe) => {
        // Migrate old format to new format if needed
        const steps = (recipe as any).steps
          ? (recipe as any).steps
          : migrateToSteps(
              (recipe as any).instructions || [],
              (recipe as any).instructionImages,
              (recipe as any).cookingActions
            );

        // For old recipes without timestamps, use a default old date
        const defaultOldDate = new Date('2024-01-01').toISOString();

        return {
          id: recipe.id,
          userId: recipe.userId,
          authorName: recipe.authorName,
          authorProfilePicture: recipe.authorProfilePicture,
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
          createdAt: recipe.createdAt || defaultOldDate,
          updatedAt: recipe.updatedAt || defaultOldDate,
        };
      });

      // Enrich recipes with author names for those that don't have them
      recipes = await enrichRecipesWithAuthorNames(recipes);

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
      let recipes: Recipe[] = firebaseRecipes.map((recipe: FirebaseRecipe) => {
        // Migrate old format to new format if needed
        const steps = (recipe as any).steps
          ? (recipe as any).steps
          : migrateToSteps(
              (recipe as any).instructions || [],
              (recipe as any).instructionImages,
              (recipe as any).cookingActions
            );

        // For old recipes without timestamps, use a default old date
        const defaultOldDate = new Date('2024-01-01').toISOString();

        return {
          id: recipe.id,
          userId: recipe.userId,
          authorName: recipe.authorName,
          authorProfilePicture: recipe.authorProfilePicture,
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
          createdAt: recipe.createdAt || defaultOldDate,
          updatedAt: recipe.updatedAt || defaultOldDate,
        };
      });

      // Enrich recipes with author names for those that don't have them
      recipes = await enrichRecipesWithAuthorNames(recipes);

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
  addRecipesBatch: async (recipes: Omit<Recipe, 'id'>[], userId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Convert all recipes to CreateRecipeData format
      const createDataArray: CreateRecipeData[] = recipes.map(recipe => {
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
          published: recipe.published ?? false,
        };
        if (recipe.tags !== undefined) {
          createData.tags = recipe.tags;
        }
        if (recipe.image !== undefined) {
          createData.image = recipe.image;
        }
        if (recipe.chefiqAppliance !== undefined) {
          createData.chefiqAppliance = recipe.chefiqAppliance;
        }
        if (recipe.stepSections !== undefined) {
          createData.stepSections = recipe.stepSections;
        }
        if (recipe.useProbe !== undefined) {
          createData.useProbe = recipe.useProbe;
        }
        return createData;
      });

      // Use batch create for better performance
      await createRecipesBatch(createDataArray);

      // Refetch both recipe lists to ensure store is up-to-date
      await get().fetchRecipes(userId);
      await get().fetchUserRecipes(userId);

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add recipes';
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

      // Use batch delete for better performance (10-100x faster for multiple recipes)
      console.log(`Deleting ${ids.length} recipes using batch write...`);
      await deleteRecipesBatch(ids, userId);

      // Refetch both recipe lists to ensure store is up-to-date
      await get().fetchRecipes(userId);
      await get().fetchUserRecipes(userId);

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete recipes',
        isLoading: false
      });
      // Re-throw the error so it can be caught in the UI
      throw error;
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

// Theme store with persistence
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeVariant: 'fresh',
      setThemeVariant: (variant: ThemeVariant) => {
        set({ themeVariant: variant });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Kitchen store with persistence
export const useFridgeStore = create<FridgeState>()(
  persist(
    (set, get) => ({
      // Initial state
      ingredients: [],
      preferences: {
        dietary: 'None',
        cuisine: 'Any',
        cookingTime: 'Any',
        category: 'Any',
        matchingStrictness: 'substitutions',
        recipeSource: 'ai',
      },
      generatedRecipeTitles: [],
      pendingRecipeUpdate: null,
      isLoading: false,
      error: null,

      // Ingredient management actions
      addIngredient: (ingredient: FridgeIngredient) => {
        const { ingredients } = get();
        // Check if ingredient already exists
        const exists = ingredients.some((i) => i.id === ingredient.id);
        if (!exists) {
          set({ ingredients: [...ingredients, ingredient] });
        }
      },

      removeIngredient: (id: string) => {
        const { ingredients } = get();
        set({ ingredients: ingredients.filter((i) => i.id !== id) });
      },

      clearIngredients: () => {
        set({ ingredients: [], generatedRecipeTitles: [] });
      },

      // Preference management actions
      setDietaryPreference: (dietary: DietaryPreference) => {
        set({ preferences: { ...get().preferences, dietary } });
      },

      setCuisinePreference: (cuisine: CuisinePreference) => {
        set({ preferences: { ...get().preferences, cuisine } });
      },

      setCookingTimePreference: (time: CookingTimePreference) => {
        set({ preferences: { ...get().preferences, cookingTime: time } });
      },

      setCategoryPreference: (category: CategoryPreference) => {
        set({ preferences: { ...get().preferences, category } });
      },

      setMatchingStrictness: (strictness: MatchingStrictness) => {
        set({ preferences: { ...get().preferences, matchingStrictness: strictness } });
      },

      setRecipeSource: (source: RecipeSource) => {
        set({ preferences: { ...get().preferences, recipeSource: source } });
      },

      resetPreferences: () => {
        set({
          preferences: {
            dietary: 'None',
            cuisine: 'Any',
            cookingTime: 'Any',
            category: 'Any',
            matchingStrictness: 'substitutions',
            recipeSource: 'ai',
          },
        });
      },

      // Generated recipe tracking actions
      addGeneratedRecipeTitle: (title: string) => {
        const { generatedRecipeTitles } = get();
        set({ generatedRecipeTitles: [...generatedRecipeTitles, title.toLowerCase()] });
      },

      clearGeneratedRecipeTitles: () => {
        set({ generatedRecipeTitles: [] });
      },

      // Pending recipe update actions
      setPendingRecipeUpdate: (update: { recipe: any; index: number } | null) => {
        set({ pendingRecipeUpdate: update });
      },
    }),
    {
      name: 'fridge-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Grocery Cart Store
 * Firebase-backed shopping cart with AsyncStorage cache
 * Syncs across devices and persists through app reinstalls
 */
export interface CartState {
  items: CartItem[];
  totalItems: number;
  recipeIds: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: (userId: string) => Promise<void>;
  addItems: (items: CartItem[], userId: string) => Promise<void>;
  removeItem: (itemId: string, userId: string) => Promise<void>;
  removeRecipeItems: (recipeId: string, userId: string) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number, userId: string) => Promise<void>;
  toggleItemSelection: (itemId: string, userId: string) => Promise<void>;
  updateRecipeServings: (recipeId: string, newServings: number, userId: string) => Promise<void>;
  clearCart: (userId: string) => Promise<void>;
  getItemsByRecipe: (recipeId: string) => CartItem[];
  getRecipeCount: () => number;
  isRecipeInCart: (recipeId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      recipeIds: [],
      isLoading: false,
      error: null,

      // Fetch cart from Firebase
      fetchCart: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });

          const { getCart } = await import('../modules/cart/cartService');
          const cart = await getCart(userId);

          set({
            items: cart.items,
            totalItems: cart.totalItems,
            recipeIds: cart.recipeIds,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching cart:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch cart',
            isLoading: false,
          });
        }
      },

      // Add items to cart (Firebase + local)
      addItems: async (newItems: CartItem[], userId: string) => {
        try {
          set({ isLoading: true, error: null });

          // Optimistic update (update UI immediately)
          const existingItems = get().items;
          const updatedItems = [...existingItems, ...newItems];
          const uniqueRecipeIds = Array.from(
            new Set(updatedItems.map(item => item.recipeId))
          );

          set({
            items: updatedItems,
            totalItems: updatedItems.length,
            recipeIds: uniqueRecipeIds,
          });

          // Sync to Firebase
          const { addItemsToCart } = await import('../modules/cart/cartService');
          await addItemsToCart(userId, newItems);

          set({ isLoading: false });
        } catch (error) {
          console.error('Error adding items to cart:', error);
          // Revert optimistic update on error
          await get().fetchCart(userId);
          set({
            error: error instanceof Error ? error.message : 'Failed to add items',
            isLoading: false,
          });
          throw error;
        }
      },

      // Remove single item (Firebase + local)
      removeItem: async (itemId: string, userId: string) => {
        try {
          set({ isLoading: true, error: null });

          // Optimistic update
          const updatedItems = get().items.filter(item => item.id !== itemId);
          const uniqueRecipeIds = Array.from(
            new Set(updatedItems.map(item => item.recipeId))
          );

          set({
            items: updatedItems,
            totalItems: updatedItems.length,
            recipeIds: uniqueRecipeIds,
          });

          // Sync to Firebase
          const { removeItemFromCart } = await import('../modules/cart/cartService');
          await removeItemFromCart(userId, itemId);

          set({ isLoading: false });
        } catch (error) {
          console.error('Error removing item from cart:', error);
          // Revert optimistic update on error
          await get().fetchCart(userId);
          set({
            error: error instanceof Error ? error.message : 'Failed to remove item',
            isLoading: false,
          });
          throw error;
        }
      },

      // Remove all items from a recipe (Firebase + local)
      removeRecipeItems: async (recipeId: string, userId: string) => {
        try {
          set({ isLoading: true, error: null });

          // Optimistic update
          const updatedItems = get().items.filter(item => item.recipeId !== recipeId);
          const uniqueRecipeIds = Array.from(
            new Set(updatedItems.map(item => item.recipeId))
          );

          set({
            items: updatedItems,
            totalItems: updatedItems.length,
            recipeIds: uniqueRecipeIds,
          });

          // Sync to Firebase
          const { removeRecipeFromCart } = await import('../modules/cart/cartService');
          await removeRecipeFromCart(userId, recipeId);

          set({ isLoading: false });
        } catch (error) {
          console.error('Error removing recipe items from cart:', error);
          // Revert optimistic update on error
          await get().fetchCart(userId);
          set({
            error: error instanceof Error ? error.message : 'Failed to remove recipe items',
            isLoading: false,
          });
          throw error;
        }
      },

      // Update item quantity (Firebase + local)
      updateItemQuantity: async (itemId: string, quantity: number, userId: string) => {
        try {
          set({ isLoading: true, error: null });

          // Optimistic update
          const updatedItems = get().items.map(item => {
            if (item.id === itemId) {
              return { ...item, quantity };
            }
            return item;
          });

          set({ items: updatedItems });

          // Sync to Firebase
          const { updateItemQuantity: updateItemQty } = await import('../modules/cart/cartService');
          await updateItemQty(userId, itemId, quantity);

          set({ isLoading: false });
        } catch (error) {
          console.error('Error updating item quantity:', error);
          // Revert optimistic update on error
          await get().fetchCart(userId);
          set({
            error: error instanceof Error ? error.message : 'Failed to update quantity',
            isLoading: false,
          });
          throw error;
        }
      },

      // Toggle item selection (Firebase + local)
      toggleItemSelection: async (itemId: string, userId: string) => {
        try {
          // Optimistic update (no loading spinner for instant feedback)
          const updatedItems = get().items.map(item =>
            item.id === itemId ? { ...item, selected: !item.selected } : item
          );

          set({ items: updatedItems });

          // Sync to Firebase in background
          const { updateCart } = await import('../modules/cart/cartService');
          await updateCart(userId, {
            items: updatedItems,
            totalItems: updatedItems.length,
            recipeIds: get().recipeIds,
          });
        } catch (error) {
          console.error('Error toggling item selection:', error);
          // Revert optimistic update on error
          await get().fetchCart(userId);
          set({
            error: error instanceof Error ? error.message : 'Failed to update selection',
          });
          throw error;
        }
      },

      // Update recipe servings and scale all ingredients (Firebase + local)
      updateRecipeServings: async (recipeId: string, newServings: number, userId: string) => {
        try {
          // Get all items for this recipe
          const recipeItems = get().items.filter(item => item.recipeId === recipeId);
          if (recipeItems.length === 0) {
            return;
          }

          // Calculate scale factor
          const originalServings = recipeItems[0].recipeOriginalServings;
          const oldServings = recipeItems[0].recipeServings;
          const scaleFactor = newServings / originalServings;

          // Update all items for this recipe with scaled quantities (optimistic update)
          const updatedItems = get().items.map(item => {
            if (item.recipeId !== recipeId) {
              return item;
            }

            // Parse the original ingredient to get base quantity
            const baseQuantity = item.quantity ? item.quantity / (oldServings / originalServings) : undefined;

            // Scale the quantity
            const newQuantity = baseQuantity ? baseQuantity * scaleFactor : undefined;

            return {
              ...item,
              recipeServings: newServings,
              quantity: newQuantity,
            };
          });

          set({ items: updatedItems });

          // Sync to Firebase in background
          const { updateCart } = await import('../modules/cart/cartService');
          await updateCart(userId, {
            items: updatedItems,
            totalItems: updatedItems.length,
            recipeIds: get().recipeIds,
          });
        } catch (error) {
          console.error('Error updating recipe servings:', error);
          // Revert optimistic update on error
          await get().fetchCart(userId);
          set({
            error: error instanceof Error ? error.message : 'Failed to update servings',
          });
          throw error;
        }
      },

      // Clear entire cart (Firebase + local)
      clearCart: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });

          // Optimistic update
          set({
            items: [],
            totalItems: 0,
            recipeIds: [],
          });

          // Sync to Firebase
          const { clearCart: clearCartService } = await import('../modules/cart/cartService');
          await clearCartService(userId);

          set({ isLoading: false });
        } catch (error) {
          console.error('Error clearing cart:', error);
          // Revert optimistic update on error
          await get().fetchCart(userId);
          set({
            error: error instanceof Error ? error.message : 'Failed to clear cart',
            isLoading: false,
          });
          throw error;
        }
      },

      // Get items by recipe (local only - no Firebase call needed)
      getItemsByRecipe: (recipeId: string) => {
        return get().items.filter(item => item.recipeId === recipeId);
      },

      // Get recipe count (local only - no Firebase call needed)
      getRecipeCount: () => {
        return get().recipeIds.length;
      },

      // Check if recipe is in cart (local only - no Firebase call needed)
      isRecipeInCart: (recipeId: string) => {
        return get().recipeIds.includes(recipeId);
      },
    }),
    {
      name: 'grocery-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist items for offline support, not loading/error states
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        recipeIds: state.recipeIds,
      }),
    }
  )
);
