// Default values for recipe creation form
export const RECIPE_DEFAULTS = {
  // Basic Info
  TITLE: '',
  IMAGE_URL: '',
  CATEGORY: '',
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
  INSTRUCTIONS: [''],

  // ChefIQ Settings
  SELECTED_APPLIANCE: '',
  USE_PROBE: false,
  COOKING_ACTIONS: [] as any[],

  // UI States
  SHOW_IMPORT_SECTION: false,
  IS_IMPORTING: false,
  IMPORT_URL: '',
  CURRENT_STEP_INDEX: null as number | null,

  // Modal States
  SHOW_COOKING_SELECTOR: false,
  SHOW_SERVINGS_PICKER: false,
  SHOW_COOK_TIME_PICKER: false,
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
    formData.cookTime > RECIPE_DEFAULTS.COOK_TIME ||
    formData.servings !== RECIPE_DEFAULTS.SERVINGS ||
    formData.ingredients.some(i => i.trim()) ||
    formData.instructions.some(i => i.trim()) ||
    formData.notes ||
    formData.selectedAppliance ||
    formData.cookingActions.length > 0
  );
};

// Type definitions for form state
export interface RecipeFormState {
  // Basic Info
  title: string;
  imageUrl: string;
  category: string;
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
  instructions: string[];

  // ChefIQ Settings
  selectedAppliance: string;
  useProbe: boolean;
  cookingActions: any[];

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
  showCancelConfirmation: boolean;
}

// Helper function to get initial form state
export const getInitialFormState = (): RecipeFormState => ({
  title: RECIPE_DEFAULTS.TITLE,
  imageUrl: RECIPE_DEFAULTS.IMAGE_URL,
  category: RECIPE_DEFAULTS.CATEGORY,
  cookTime: RECIPE_DEFAULTS.COOK_TIME,
  cookTimeHours: RECIPE_DEFAULTS.COOK_TIME_HOURS,
  cookTimeMinutes: RECIPE_DEFAULTS.COOK_TIME_MINUTES,
  servings: RECIPE_DEFAULTS.SERVINGS,
  difficulty: RECIPE_DEFAULTS.DIFFICULTY,
  ingredients: [...RECIPE_DEFAULTS.INGREDIENTS],
  instructions: [...RECIPE_DEFAULTS.INSTRUCTIONS],
  notes: RECIPE_DEFAULTS.NOTES,
  importUrl: RECIPE_DEFAULTS.IMPORT_URL,
  selectedAppliance: RECIPE_DEFAULTS.SELECTED_APPLIANCE,
  useProbe: RECIPE_DEFAULTS.USE_PROBE,
  cookingActions: [...RECIPE_DEFAULTS.COOKING_ACTIONS],
  showImportSection: RECIPE_DEFAULTS.SHOW_IMPORT_SECTION,
  isImporting: RECIPE_DEFAULTS.IS_IMPORTING,
  currentStepIndex: RECIPE_DEFAULTS.CURRENT_STEP_INDEX,
});

// Helper function to get initial modal state
export const getInitialModalState = (): RecipeModalState => ({
  showCookingSelector: RECIPE_DEFAULTS.SHOW_COOKING_SELECTOR,
  showServingsPicker: RECIPE_DEFAULTS.SHOW_SERVINGS_PICKER,
  showCookTimePicker: RECIPE_DEFAULTS.SHOW_COOK_TIME_PICKER,
  showCancelConfirmation: RECIPE_DEFAULTS.SHOW_CANCEL_CONFIRMATION,
});