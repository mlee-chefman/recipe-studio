import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  Recipe,
  CreateRecipeData,
  UpdateRecipeData,
} from '../../types/recipe';
import {
  deepCleanUndefined,
  mapFirebaseDataToRecipe
} from '../../utils/helpers/firebaseHelpers';

// Re-export types for backward compatibility
export type { Recipe, CreateRecipeData, UpdateRecipeData };

// Re-export helper functions
export { enrichRecipesWithAuthorNames } from '../../utils/helpers/recipeHelpers';

// Create a new recipe in Firestore
export const createRecipe = async (data: CreateRecipeData): Promise<string> => {
  try {
    const recipesRef = collection(db, 'recipes');
    const recipeRef = doc(recipesRef);
    const now = new Date().toUTCString();

    // Build recipe object with only required fields first
    const recipeData: Partial<Omit<Recipe, 'id' | 'status'>> = {
      userId: data.userId,
      title: data.title,
      description: data.description,
      ingredients: data.ingredients,
      steps: data.steps,
      cookTime: data.cookTime,
      servings: data.servings,
      difficulty: data.difficulty as 'Easy' | 'Medium' | 'Hard',
      category: data.category,
      published: data.published ?? false,
      createdAt: now,
      updatedAt: now
    };

    // Only add optional fields if they are provided and not undefined
    if (data.tags !== undefined) {
      recipeData.tags = data.tags;
    }
    if (data.image !== undefined) {
      recipeData.image = data.image;
    }
    if (data.chefiqAppliance !== undefined) {
      recipeData.chefiqAppliance = data.chefiqAppliance;
    }
    if (data.stepSections !== undefined) {
      recipeData.stepSections = data.stepSections;
    }
    if (data.useProbe !== undefined) {
      recipeData.useProbe = data.useProbe;
    }

    // Deep clean to remove any undefined values in nested objects and arrays
    const cleanedRecipeData = deepCleanUndefined(recipeData);

    await setDoc(recipeRef, cleanedRecipeData);
    return recipeRef.id;
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw error;
  }
};

// Get a single recipe from Firestore
export const getRecipe = async (recipeId: string): Promise<Recipe | null> => {
  try {
    const recipeRef = doc(db, 'recipes', recipeId);
    const recipeSnap: DocumentSnapshot<DocumentData> = await getDoc(recipeRef);

    if (recipeSnap.exists()) {
      const data = recipeSnap.data();
      return mapFirebaseDataToRecipe(recipeSnap.id, data);
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting recipe:', error);
    throw error;
  }
};

// Get all published recipes
export const getRecipes = async (userId: string): Promise<Recipe[]> => {
  try {
    const recipesRef = collection(db, 'recipes');
    const q = query(
      recipesRef,
      where('published', '==', true),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const recipes: Recipe[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      recipes.push(mapFirebaseDataToRecipe(doc.id, data));
    });

    return recipes;
  } catch (error) {
    console.error('Error getting recipes:', error);
    throw error;
  }
};

// Update a recipe in Firestore
export const updateRecipe = async (
  recipeId: string,
  data: UpdateRecipeData,
  userId: string
): Promise<void> => {
  try {
    // First, verify ownership by fetching the recipe
    const existingRecipe = await getRecipe(recipeId);

    if (!existingRecipe) {
      throw new Error('Recipe not found');
    }

    if (existingRecipe.userId !== userId) {
      throw new Error('Unauthorized: You can only update your own recipes');
    }

    const recipeRef = doc(db, 'recipes', recipeId);

    // Deep clean to remove undefined fields (including nested objects and arrays)
    const cleanedData = deepCleanUndefined(data);

    const updateData = {
      ...cleanedData,
      updatedAt: new Date().toUTCString()
    };

    await updateDoc(recipeRef, updateData);
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
};

// Delete a recipe from Firestore
export const deleteRecipe = async (recipeId: string, userId: string): Promise<void> => {
  try {
    // First, verify ownership by fetching the recipe
    const existingRecipe = await getRecipe(recipeId);

    if (!existingRecipe) {
      throw new Error('Recipe not found');
    }

    if (existingRecipe.userId !== userId) {
      throw new Error('Unauthorized: You can only delete your own recipes');
    }

    const recipeRef = doc(db, 'recipes', recipeId);
    await deleteDoc(recipeRef);
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
};

// Check if a recipe exists
export const recipeExists = async (recipeId: string): Promise<boolean> => {
  try {
    const recipeRef = doc(db, 'recipes', recipeId);
    const recipeSnap = await getDoc(recipeRef);
    return recipeSnap.exists();
  } catch (error) {
    console.error('Error checking recipe existence:', error);
    throw error;
  }
};

// Get recipes by category for a specific user
export const getRecipesByCategory = async (userId: string, category: string): Promise<Recipe[]> => {
  try {
    const recipesRef = collection(db, 'recipes');
    const q = query(
      recipesRef,
      where('userId', '==', userId),
      where('category', '==', category),
      where('published', '==', true),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const recipes: Recipe[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      recipes.push(mapFirebaseDataToRecipe(doc.id, data));
    });
    
    return recipes;
  } catch (error) {
    console.error('Error getting recipes by category:', error);
    throw error;
  }
};

// Get all recipes for a specific user (including unpublished ones)
export const getRecipesByUserId = async (userId: string): Promise<Recipe[]> => {
  try {
    const recipesRef = collection(db, 'recipes');
    const q = query(
      recipesRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const recipes: Recipe[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      recipes.push(mapFirebaseDataToRecipe(doc.id, data));
    });
    
    return recipes;
  } catch (error) {
    console.error('Error getting recipes by user ID:', error);
    throw error;
  }
};

// Search recipes by title for a specific user
export const searchRecipesByTitle = async (userId: string, searchTerm: string): Promise<Recipe[]> => {
  try {
    const recipesRef = collection(db, 'recipes');
    const q = query(
      recipesRef,
      where('userId', '==', userId),
      orderBy('title')
    );
    
    const querySnapshot = await getDocs(q);
    const recipes: Recipe[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Client-side filtering for title search (Firestore doesn't support full-text search)
      if (data.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        recipes.push(mapFirebaseDataToRecipe(doc.id, data));
      }
    });
    
    return recipes;
  } catch (error) {
    console.error('Error searching recipes by title:', error);
    throw error;
  }
};
