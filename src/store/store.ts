import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CookingAction, InstructionSection } from '../types/chefiq';
import { AuthUser } from '../modules/user/userAuth';
import { UserProfile } from '../modules/user/userService';
import { 
  createRecipe, 
  getRecipes, 
  getRecipesByUserId,
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
  published: boolean; // whether the recipe is published
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
  // Search and filter state for MyRecipes tab
  userRecipesSearchQuery: string;
  userRecipesSelectedCategory: string;
  userRecipesSelectedDifficulty: string;
  userRecipesSelectedTags: string[];
  userRecipesSelectedAppliance: string;
  // Actions for Home tab
  setAllRecipesSearchQuery: (query: string) => void;
  setAllRecipesSelectedCategory: (category: string) => void;
  setAllRecipesSelectedDifficulty: (difficulty: string) => void;
  setAllRecipesSelectedTags: (tags: string[]) => void;
  setAllRecipesSelectedAppliance: (appliance: string) => void;
  filterAllRecipes: () => void;
  // Actions for MyRecipes tab
  setUserRecipesSearchQuery: (query: string) => void;
  setUserRecipesSelectedCategory: (category: string) => void;
  setUserRecipesSelectedDifficulty: (difficulty: string) => void;
  setUserRecipesSelectedTags: (tags: string[]) => void;
  setUserRecipesSelectedAppliance: (appliance: string) => void;
  filterUserRecipes: () => void;
  // Data fetching
  fetchRecipes: (userId: string) => Promise<void>;
  fetchUserRecipes: (userId: string) => Promise<void>;
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
  fetchRecipes: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const firebaseRecipes = await getRecipes(userId);
      
      // Convert Firebase recipes to store Recipe format
      const recipes: Recipe[] = firebaseRecipes.map((recipe: FirebaseRecipe) => ({
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
        published: recipe.published,
      }));
      
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
      const recipes: Recipe[] = firebaseRecipes.map((recipe: FirebaseRecipe) => ({
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
        published: recipe.published,
      }));
      
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
        published: recipe.published,
      };
      
      await createRecipe(createData);
      
      // Refetch both recipe lists to ensure store is up-to-date
      await get().fetchRecipes(userId);
      await get().fetchUserRecipes(userId);
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
  updateRecipe: async (id: string, recipe: Partial<Omit<Recipe, 'id'>>, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      await updateRecipeService(id, recipe);
      
      // Refetch both recipe lists to ensure store is up-to-date
      await get().fetchRecipes(userId);
      await get().fetchUserRecipes(userId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update recipe',
        isLoading: false 
      });
    }
  },
}));
