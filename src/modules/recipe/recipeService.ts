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
  DocumentData,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CookingAction, InstructionSection } from '../../types/chefiq';

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookTime: number;
  servings: number;
  difficulty: string;
  category: string;
  tags?: string[];
  image?: string;
  chefiqAppliance?: string;
  cookingActions?: CookingAction[];
  instructionSections?: InstructionSection[];
  useProbe?: boolean;
  published: boolean;
  createdAt: String;
  updatedAt: String;
}

export interface CreateRecipeData {
  userId: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookTime: number;
  servings: number;
  difficulty: string;
  category: string;
  tags?: string[];
  image?: string;
  chefiqAppliance?: string;
  cookingActions?: CookingAction[];
  instructionSections?: InstructionSection[];
  useProbe?: boolean;
  published?: boolean;
}

export interface UpdateRecipeData {
  title?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  category?: string;
  tags?: string[];
  image?: string;
  chefiqAppliance?: string;
  cookingActions?: CookingAction[];
  instructionSections?: InstructionSection[];
  useProbe?: boolean;
  published?: boolean;
}

// Create a new recipe in Firestore
export const createRecipe = async (data: CreateRecipeData): Promise<string> => {
  try {
    const recipesRef = collection(db, 'recipes');
    const recipeRef = doc(recipesRef);
    const now = new Date().toUTCString();
    
    const recipe: Omit<Recipe, 'id'> = {
      userId: data.userId,
      title: data.title,
      description: data.description,
      ingredients: data.ingredients,
      instructions: data.instructions,
      cookTime: data.cookTime,
      servings: data.servings,
      difficulty: data.difficulty,
      category: data.category,
      tags: data.tags ?? [],
      image: data.image,
      chefiqAppliance: data.chefiqAppliance,
      cookingActions: data.cookingActions,
      instructionSections: data.instructionSections ?? [],
      useProbe: data.useProbe ?? false,
      published: data.published ?? false,
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(recipeRef, recipe);
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
      return {
        id: recipeSnap.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions,
        cookTime: data.cookTime,
        servings: data.servings,
        difficulty: data.difficulty,
        category: data.category,
        tags: data.tags,
        image: data.image,
        chefiqAppliance: data.chefiqAppliance,
        cookingActions: data.cookingActions,
        instructionSections: data.instructionSections,
        useProbe: data.useProbe,
        published: data.published ?? false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting recipe:', error);
    throw error;
  }
};

// Get all recipes for a specific user
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
      recipes.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions,
        cookTime: data.cookTime,
        servings: data.servings,
        difficulty: data.difficulty,
        category: data.category,
        tags: data.tags,
        image: data.image,
        chefiqAppliance: data.chefiqAppliance,
        cookingActions: data.cookingActions,
        instructionSections: data.instructionSections,
        useProbe: data.useProbe,
        published: data.published ?? false,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
      });
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
  data: UpdateRecipeData
): Promise<void> => {
  try {
    const recipeRef = doc(db, 'recipes', recipeId);
    const updateData = {
      ...data,
      updatedAt: new Date().toUTCString()
    };
    
    await updateDoc(recipeRef, updateData);
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
};

// Delete a recipe from Firestore
export const deleteRecipe = async (recipeId: string): Promise<void> => {
  try {
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
      recipes.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions,
        cookTime: data.cookTime,
        servings: data.servings,
        difficulty: data.difficulty,
        category: data.category,
        tags: data.tags,
        image: data.image,
        chefiqAppliance: data.chefiqAppliance,
        cookingActions: data.cookingActions,
        instructionSections: data.instructionSections,
        useProbe: data.useProbe,
        published: data.published ?? false,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
      });
    });
    
    return recipes;
  } catch (error) {
    console.error('Error getting recipes by category:', error);
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
        recipes.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          description: data.description,
          ingredients: data.ingredients,
          instructions: data.instructions,
          cookTime: data.cookTime,
          servings: data.servings,
          difficulty: data.difficulty,
          category: data.category,
          tags: data.tags,
          image: data.image,
          chefiqAppliance: data.chefiqAppliance,
          cookingActions: data.cookingActions,
          instructionSections: data.instructionSections,
          useProbe: data.useProbe,
          published: data.published ?? false,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
        });
      }
    });
    
    return recipes;
  } catch (error) {
    console.error('Error searching recipes by title:', error);
    throw error;
  }
};
