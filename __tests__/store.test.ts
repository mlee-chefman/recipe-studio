import { useRecipeStore } from '../src/store/store';

// Mock the recipe service
jest.mock('../src/modules/recipe/recipeService', () => ({
  createRecipe: jest.fn(),
  getRecipes: jest.fn(),
  updateRecipe: jest.fn(),
  deleteRecipe: jest.fn(),
}));

describe('Recipe Store Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    useRecipeStore.setState({
      recipes: [],
      filteredRecipes: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      selectedCategory: '',
      selectedDifficulty: '',
      selectedTags: [],
      selectedAppliance: '',
    });
  });

  it('should initialize with empty state', () => {
    const state = useRecipeStore.getState();
    
    expect(state.recipes).toEqual([]);
    expect(state.filteredRecipes).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.searchQuery).toBe('');
    expect(state.selectedCategory).toBe('');
    expect(state.selectedDifficulty).toBe('');
    expect(state.selectedTags).toEqual([]);
    expect(state.selectedAppliance).toBe('');
  });

  it('should update search query and filter recipes', () => {
    const { setSearchQuery } = useRecipeStore.getState();
    
    setSearchQuery('test');
    
    const state = useRecipeStore.getState();
    expect(state.searchQuery).toBe('test');
  });

  it('should update selected category and filter recipes', () => {
    const { setSelectedCategory } = useRecipeStore.getState();
    
    setSelectedCategory('Italian');
    
    const state = useRecipeStore.getState();
    expect(state.selectedCategory).toBe('Italian');
  });

  it('should update selected difficulty and filter recipes', () => {
    const { setSelectedDifficulty } = useRecipeStore.getState();
    
    setSelectedDifficulty('Easy');
    
    const state = useRecipeStore.getState();
    expect(state.selectedDifficulty).toBe('Easy');
  });

  it('should update selected tags and filter recipes', () => {
    const { setSelectedTags } = useRecipeStore.getState();
    
    setSelectedTags(['quick', 'healthy']);
    
    const state = useRecipeStore.getState();
    expect(state.selectedTags).toEqual(['quick', 'healthy']);
  });

  it('should update selected appliance and filter recipes', () => {
    const { setSelectedAppliance } = useRecipeStore.getState();
    
    setSelectedAppliance('air-fryer');
    
    const state = useRecipeStore.getState();
    expect(state.selectedAppliance).toBe('air-fryer');
  });

  it('should have async recipe management functions', () => {
    const state = useRecipeStore.getState();
    
    expect(typeof state.fetchRecipes).toBe('function');
    expect(typeof state.addRecipe).toBe('function');
    expect(typeof state.updateRecipe).toBe('function');
    expect(typeof state.deleteRecipe).toBe('function');
  });
});
