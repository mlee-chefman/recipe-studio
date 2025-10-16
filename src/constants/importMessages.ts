/**
 * Constants for recipe import functionality
 */

// Processing step messages
export const IMPORT_MESSAGES = {
  // PDF Import
  PDF: {
    EXTRACTING: 'Extracting text from PDF...',
    PARSING: 'Finding and parsing recipes...',
    PROCESSING: 'Processing PDF...',
    PROCESSING_LONG: 'This may take a minute for large cookbooks',
  },

  // OCR Import
  OCR: {
    EXTRACTING: 'Extracting text from image...',
    ORGANIZING: 'Organizing recipe with AI...',
    PROCESSING: 'Processing...',
  },

  // Text Import
  TEXT: {
    PARSING: 'Parsing recipes with AI...',
    PROCESSING_LONG: 'This may take a moment for multiple recipes',
  },

  // Web Import
  WEB: {
    SCRAPING: 'Scraping recipe from website...',
    ANALYZING: 'Analyzing recipe data...',
    IMPORTING: 'Importing recipe...',
  },

  // Generic
  GENERIC: {
    IMPORTING: 'Importing...',
    PROCESSING: 'Processing...',
    PLEASE_WAIT: 'Please wait...',
  },
} as const;

// Success messages
export const IMPORT_SUCCESS = {
  SINGLE_RECIPE: 'Recipe imported successfully. You can find it in your recipe collection.',
  MULTIPLE_RECIPES: (count: number) =>
    `${count} recipe${count > 1 ? 's' : ''} imported successfully. You can find ${count > 1 ? 'them' : 'it'} in your recipe collection.`,
} as const;

// Error messages
export const IMPORT_ERRORS = {
  NO_FILE: 'Please select a file first.',
  NO_TEXT: 'Please paste or enter recipe text first.',
  NO_URL: 'Please enter a URL first.',
  NO_IMAGE: 'Please scan an image first.',
  NO_RECIPE: 'Please scan an image first.',
  NO_SELECTION: 'Please select at least one recipe to import.',

  // Extraction errors
  TEXT_EXTRACTION_FAILED: 'Could not extract text from PDF. Please try a different file.',
  NO_TEXT_DETECTED: 'Could not detect any text in the image. Please try with a clearer image.',
  NO_RECIPES_FOUND: 'Could not find any recipes in the text. Please make sure it contains recipe information.',

  // Parsing errors
  PARSING_FAILED: 'Could not parse recipe. Please try again.',
  AI_PARSING_UNAVAILABLE: 'Could not parse recipe with AI. Using basic parsing instead. You can edit the recipe after importing if needed.',

  // Generic errors
  PROCESSING_FAILED: 'Could not process the image. Please try again with a different image.',
  IMPORT_FAILED: 'Failed to import recipes. Please try again.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Instruction text
export const IMPORT_INSTRUCTIONS = {
  PDF: {
    TITLE: 'Import PDF Cookbook',
    STEPS: [
      'Select a PDF file containing recipe(s)',
      'AI will extract text from the PDF',
      'Automatically detect all recipes in the document',
      'Choose which recipes to import',
    ],
    WORKS_WITH: [
      'Digital cookbooks (PDF format)',
      'Scanned recipe collections',
      'Multiple recipes in one document',
    ],
  },

  OCR: {
    TITLE: 'How to scan a recipe',
    STEPS: [
      'Take a photo or select an image of your recipe',
      'The app will automatically extract the text',
      'Review and edit the extracted recipe if needed',
      'Import the recipe to your collection',
    ],
  },

  TEXT: {
    TITLE: 'How to import text',
    STEPS: [
      'Copy recipe text from Notes, Messages, or any app',
      'Paste it here or type directly',
      'AI will automatically detect and parse recipes',
      'Works with single recipes or multiple recipes at once',
    ],
  },

  WEB: {
    TITLE: 'Import from Website',
    STEPS: [
      'Enter the URL of a recipe website',
      'AI will automatically extract the recipe',
      'Review and edit if needed',
      'Save to your collection',
    ],
  },
} as const;

// Alert titles
export const IMPORT_ALERTS = {
  SUCCESS: 'Success!',
  ERROR: 'Error',
  NO_FILE: 'No File',
  NO_TEXT: 'No Text',
  NO_URL: 'No URL',
  NO_SELECTION: 'No Selection',
  NO_RECIPES: 'No Recipes Found',
  EXTRACTION_FAILED: 'Text Extraction Failed',
  TEXT_RECOGNITION_FAILED: 'Text Recognition Failed',
  NO_TEXT_FOUND: 'No Text Found',
  PARSING_FAILED: 'Import Failed',
  AI_UNAVAILABLE: 'AI Parsing Unavailable',
  PROCESSING_FAILED: 'Processing Failed',
  PDF_NOT_SUPPORTED: 'PDF Not Supported Yet',
  PERMISSION_NEEDED: 'Permission needed',
} as const;

// Button labels
export const IMPORT_BUTTONS = {
  SELECT_PDF: 'Select PDF File',
  CHANGE_PDF: 'Change PDF File',
  SELECT_IMAGE: 'Select Image',
  CHANGE_IMAGE: 'Change Image',
  PASTE_CLIPBOARD: '📋 Paste from Clipboard',
  IMPORT_RECIPE: 'Import Recipe',
  IMPORT_RECIPES: (count: number) => `Import ${count} Recipe${count !== 1 ? 's' : ''}`,
  PARSE_IMPORT: 'Parse & Import',
  EXTRACT_IMPORT: 'Extract & Import Recipes',
  SCRAPE_IMPORT: 'Scrape & Import',
  SELECT_ALL: 'Select All',
  DESELECT_ALL: 'Deselect All',
} as const;

// Placeholder text
export const IMPORT_PLACEHOLDERS = {
  RECIPE_URL: 'https://www.example.com/recipe',
  RECIPE_TEXT: `Paste or type recipe text here...

Example:
Chocolate Chip Cookies

Ingredients:
- 2 cups flour
- 1 cup butter
- 1 cup chocolate chips

Instructions:
1. Preheat oven to 350°F
2. Mix ingredients
3. Bake for 12 minutes`,
} as const;
