import { 
  createRecipe, 
  getRecipe, 
  updateRecipe, 
  deleteRecipe, 
  getRecipes,
  recipeExists,
  getRecipesByCategory,
  searchRecipesByTitle,
  CreateRecipeData,
  UpdateRecipeData 
} from '../src/modules/recipe/recipeService';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: jest.fn().mockImplementation(() => ({
    toDate: jest.fn().mockReturnValue(new Date()),
  })),
}));

jest.mock('../src/services/firebase', () => ({
  db: {},
}));

describe('Recipe Service', () => {
  const mockUserId = 'test-user-123';
  const mockRecipeId = 'test-recipe-456';
  
  const mockCreateRecipeData: CreateRecipeData = {
    userId: mockUserId,
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    ingredients: ['1 cup flour', '2 eggs', '1 cup milk'],
    instructions: ['Mix ingredients', 'Cook for 20 minutes'],
    cookTime: 30,
    servings: 4,
    difficulty: 'Easy',
    category: 'Breakfast',
    tags: ['quick', 'easy'],
  };

  const mockUpdateRecipeData: UpdateRecipeData = {
    title: 'Updated Test Recipe',
    cookTime: 35,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRecipe', () => {
    it('should create a recipe and return the recipe ID', async () => {
      const mockDoc = { id: mockRecipeId };
      const mockCollection = jest.fn();
      const mockDocRef = jest.fn().mockReturnValue(mockDoc);
      const mockSetDoc = jest.fn().mockResolvedValue(undefined);

      require('firebase/firestore').collection.mockReturnValue({});
      require('firebase/firestore').doc.mockReturnValue(mockDoc);
      require('firebase/firestore').setDoc.mockImplementation(mockSetDoc);

      const result = await createRecipe(mockCreateRecipeData);

      expect(result).toBe(mockRecipeId);
      expect(mockSetDoc).toHaveBeenCalledWith(
        mockDoc,
        expect.objectContaining({
          userId: mockUserId,
          title: 'Test Recipe',
          description: 'A delicious test recipe',
          ingredients: ['1 cup flour', '2 eggs', '1 cup milk'],
          instructions: ['Mix ingredients', 'Cook for 20 minutes'],
          cookTime: 30,
          servings: 4,
          difficulty: 'Easy',
          category: 'Breakfast',
          tags: ['quick', 'easy'],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should handle errors when creating a recipe', async () => {
      const mockError = new Error('Firestore error');
      require('firebase/firestore').setDoc.mockRejectedValue(mockError);

      await expect(createRecipe(mockCreateRecipeData)).rejects.toThrow('Firestore error');
    });
  });

  describe('getRecipe', () => {
    it('should return a recipe when it exists', async () => {
      const mockRecipeData = {
        userId: mockUserId,
        title: 'Test Recipe',
        description: 'A delicious test recipe',
        ingredients: ['1 cup flour', '2 eggs', '1 cup milk'],
        instructions: ['Mix ingredients', 'Cook for 20 minutes'],
        cookTime: 30,
        servings: 4,
        difficulty: 'Easy',
        category: 'Breakfast',
        tags: ['quick', 'easy'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDocSnap = {
        exists: () => true,
        id: mockRecipeId,
        data: () => mockRecipeData,
      };

      require('firebase/firestore').doc.mockReturnValue({});
      require('firebase/firestore').getDoc.mockResolvedValue(mockDocSnap);

      const result = await getRecipe(mockRecipeId);

      expect(result).toEqual({
        id: mockRecipeId,
        ...mockRecipeData,
      });
    });

    it('should return null when recipe does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      require('firebase/firestore').getDoc.mockResolvedValue(mockDocSnap);

      const result = await getRecipe(mockRecipeId);

      expect(result).toBeNull();
    });
  });

  describe('updateRecipe', () => {
    it('should update a recipe successfully', async () => {
      const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
      require('firebase/firestore').doc.mockReturnValue({});
      require('firebase/firestore').updateDoc.mockImplementation(mockUpdateDoc);

      await updateRecipe(mockRecipeId, mockUpdateRecipeData);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          title: 'Updated Test Recipe',
          cookTime: 35,
          updatedAt: expect.any(Date),
        })
      );
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe successfully', async () => {
      const mockDeleteDoc = jest.fn().mockResolvedValue(undefined);
      require('firebase/firestore').doc.mockReturnValue({});
      require('firebase/firestore').deleteDoc.mockImplementation(mockDeleteDoc);

      await deleteRecipe(mockRecipeId);

      expect(mockDeleteDoc).toHaveBeenCalledWith({});
    });
  });

  describe('recipeExists', () => {
    it('should return true when recipe exists', async () => {
      const mockDocSnap = {
        exists: () => true,
      };

      require('firebase/firestore').getDoc.mockResolvedValue(mockDocSnap);

      const result = await recipeExists(mockRecipeId);

      expect(result).toBe(true);
    });

    it('should return false when recipe does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      require('firebase/firestore').getDoc.mockResolvedValue(mockDocSnap);

      const result = await recipeExists(mockRecipeId);

      expect(result).toBe(false);
    });
  });
});
