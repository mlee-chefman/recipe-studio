import { Step } from '~/types/recipe';

// Default values for recipe creation form
export const RECIPE_DEFAULTS = {
  // Basic Info
  TITLE: '',
  IMAGE_URL: '',
  CATEGORY: '',
  TAGS: [] as string[],
  DESCRIPTION: '',
  NOTES: '',

  // Time and Servings
  COOK_TIME: 0,
  COOK_TIME_HOURS: 0,
  COOK_TIME_MINUTES: 0,
  SERVINGS: 4,

  // Difficulty
  DIFFICULTY: 'Easy' as 'Easy' | 'Medium' | 'Hard',

  // Arrays
  INGREDIENTS: [''],
  STEPS: [{ text: '' }] as Step[],

  // ChefIQ Settings
  SELECTED_APPLIANCE: '',
  USE_PROBE: false,

  // Publishing
  PUBLISHED: false,

  // UI States
  SHOW_IMPORT_SECTION: false,
  IS_IMPORTING: false,
  IMPORT_URL: '',
  CURRENT_STEP_INDEX: null as number | null,

  // Modal States
  SHOW_COOKING_SELECTOR: false,
  SHOW_SERVINGS_PICKER: false,
  SHOW_COOK_TIME_PICKER: false,
  SHOW_CATEGORY_PICKER: false,
  SHOW_TAGS_PICKER: false,
  SHOW_CANCEL_CONFIRMATION: false,
} as const;

// Options for dropdowns
export const RECIPE_OPTIONS = {
  DIFFICULTIES: ['Easy', 'Medium', 'Hard'] as const,

  // Servings range
  MIN_SERVINGS: 1,
  MAX_SERVINGS: 20,

  // Cook time ranges
  MAX_HOURS: 12,
  MINUTE_INTERVALS: 5, // 0, 5, 10, 15, etc.

  // Common categories (can be extended)
  CATEGORIES: [
    'Appetizer',
    'Main Course',
    'Side Dish',
    'Dessert',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'Beverage',
    'Soup',
    'Salad',
    'Bread',
    'Sauce',
    'Marinade',
    'Condiment',
  ] as const,

  // Common tags for quick selection
  COMMON_TAGS: [
    // Dietary & Lifestyle
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Low-Carb',
    'Keto',
    'Paleo',
    // Difficulty & Time
    'Quick',
    'Easy',
    'Healthy',
    // Characteristics
    'Comfort Food',
    'Spicy',
    'Kid-Friendly',
    'Holiday',
    // Cuisines
    'American',
    'Chinese',
    'French',
    'Greek',
    'Indian',
    'Italian',
    'Japanese',
    'Korean',
    'Mediterranean',
    'Mexican',
    // Cooking Methods
    'BBQ',
    'One-Pot',
    'Slow Cooker',
    'Air Fryer',
    'Baking',
    'Grilling',
  ] as const,
} as const;

// Validation rules
export const RECIPE_VALIDATION = {
  TITLE_MAX_LENGTH: 100,
  INGREDIENT_MAX_LENGTH: 200,
  INSTRUCTION_MAX_LENGTH: 500,
  NOTES_MAX_LENGTH: 1000,
  MIN_INGREDIENTS: 1,
  MIN_INSTRUCTIONS: 1,
} as const;

// Helper function to check if form has data
export const hasFormData = (formData: RecipeFormState) => {
  return (
    formData.title ||
    formData.imageUrl ||
    formData.category ||
    formData.tags.length > 0 ||
    formData.cookTime > RECIPE_DEFAULTS.COOK_TIME ||
    formData.servings !== RECIPE_DEFAULTS.SERVINGS ||
    formData.ingredients.some(i => i.trim()) ||
    formData.steps.some(s => s.text.trim()) ||
    formData.notes ||
    formData.selectedAppliance ||
    formData.steps.some(s => s.cookingAction)
  );
};

// Helper function to check if form has changes compared to original recipe
export const hasFormChanges = (formData: RecipeFormState, originalRecipe: any) => {
  if (!originalRecipe) return hasFormData(formData);

  // Compare basic fields
  if (formData.title !== originalRecipe.title) return true;
  if (formData.imageUrl !== (originalRecipe.image || '')) return true;
  if (formData.category !== originalRecipe.category) return true;
  if (JSON.stringify(formData.tags) !== JSON.stringify(originalRecipe.tags || [])) return true;
  if (formData.notes !== originalRecipe.description) return true;
  if (formData.cookTime !== originalRecipe.cookTime) return true;
  if (formData.servings !== originalRecipe.servings) return true;
  if (formData.difficulty !== originalRecipe.difficulty) return true;
  if (formData.selectedAppliance !== (originalRecipe.chefiqAppliance || '')) return true;
  if (formData.useProbe !== (originalRecipe.useProbe || false)) return true;
  if (formData.published !== (originalRecipe.published || false)) return true;

  // Compare arrays
  const originalIngredients = originalRecipe.ingredients || [];
  const currentIngredients = formData.ingredients.filter(i => i.trim() !== '');
  if (JSON.stringify(currentIngredients) !== JSON.stringify(originalIngredients)) return true;

  const originalSteps = originalRecipe.steps || [];
  const currentSteps = formData.steps.filter(s => s.text.trim() !== '');
  if (JSON.stringify(currentSteps) !== JSON.stringify(originalSteps)) return true;

  return false;
};

// Type definitions for form state
export interface RecipeFormState {
  // Basic Info
  title: string;
  imageUrl: string;
  category: string;
  tags: string[];
  notes: string;

  // Time and Servings
  cookTime: number;
  cookTimeHours: number;
  cookTimeMinutes: number;
  servings: number;

  // Difficulty
  difficulty: 'Easy' | 'Medium' | 'Hard';

  // Arrays
  ingredients: string[];
  steps: Step[];

  // ChefIQ Settings
  selectedAppliance: string;
  useProbe: boolean;

  // Publishing
  published: boolean;

  // Import
  importUrl: string;
  isImporting: boolean;
  showImportSection: boolean;
  currentStepIndex: number | null;
}

export interface RecipeModalState {
  showCookingSelector: boolean;
  showServingsPicker: boolean;
  showCookTimePicker: boolean;
  showCategoryPicker: boolean;
  showTagsPicker: boolean;
  showCancelConfirmation: boolean;
}

// Helper function to get initial form state
export const getInitialFormState = (): RecipeFormState => ({
  title: RECIPE_DEFAULTS.TITLE,
  imageUrl: RECIPE_DEFAULTS.IMAGE_URL,
  category: RECIPE_DEFAULTS.CATEGORY,
  tags: [...RECIPE_DEFAULTS.TAGS],
  cookTime: RECIPE_DEFAULTS.COOK_TIME,
  cookTimeHours: RECIPE_DEFAULTS.COOK_TIME_HOURS,
  cookTimeMinutes: RECIPE_DEFAULTS.COOK_TIME_MINUTES,
  servings: RECIPE_DEFAULTS.SERVINGS,
  difficulty: RECIPE_DEFAULTS.DIFFICULTY,
  ingredients: [...RECIPE_DEFAULTS.INGREDIENTS],
  steps: [...RECIPE_DEFAULTS.STEPS],
  notes: RECIPE_DEFAULTS.NOTES,
  importUrl: RECIPE_DEFAULTS.IMPORT_URL,
  selectedAppliance: RECIPE_DEFAULTS.SELECTED_APPLIANCE,
  useProbe: RECIPE_DEFAULTS.USE_PROBE,
  published: RECIPE_DEFAULTS.PUBLISHED,
  showImportSection: RECIPE_DEFAULTS.SHOW_IMPORT_SECTION,
  isImporting: RECIPE_DEFAULTS.IS_IMPORTING,
  currentStepIndex: RECIPE_DEFAULTS.CURRENT_STEP_INDEX,
});

// Helper function to get initial modal state
export const getInitialModalState = (): RecipeModalState => ({
  showCookingSelector: RECIPE_DEFAULTS.SHOW_COOKING_SELECTOR,
  showServingsPicker: RECIPE_DEFAULTS.SHOW_SERVINGS_PICKER,
  showCookTimePicker: RECIPE_DEFAULTS.SHOW_COOK_TIME_PICKER,
  showCategoryPicker: RECIPE_DEFAULTS.SHOW_CATEGORY_PICKER,
  showTagsPicker: RECIPE_DEFAULTS.SHOW_TAGS_PICKER,
  showCancelConfirmation: RECIPE_DEFAULTS.SHOW_CANCEL_CONFIRMATION,
});
