# ChefIQ Export Format Implementation Guide

## Overview

This document outlines the implementation plan for exporting recipes in ChefIQ-compatible format for guided cooking on ChefIQ devices (RJ40 Smart Cooker and CQ50 Smart Mini Oven).

## Goals

1. **Generate ChefIQ-compatible JSON** from Recipe Studio recipes
2. **Support both appliance types** (Smart Cooker and Smart Mini Oven)
3. **Include all cooking actions** with proper parameters and step associations
4. **Validate export format** against ChefIQ device requirements
5. **Enable guided cooking** on actual ChefIQ devices

## ChefIQ Recipe Format Structure

**IMPORTANT:** This is the **legacy format** currently used by ChefIQ Mini Oven (CQ50). A simpler payload format is planned for the future, but this is what's required for devices to work today.

### Key Requirements

1. **Sections are mandatory** - Recipes must be organized into sections (Prep, Cook, Serve)
2. **sections_recipes_actions** - Cooking functions are defined here with `start_cooking_func` and `end_cooking_func`
3. **cooking_func_id** - Each cooking function needs a unique ID (e.g., "Bake 1")
4. **Chaining cooking functions** - To start a new cooking function, use `end_cooking_func` referencing the previous `cooking_func_id`
5. **Only CQ50 Mini Oven** - This implementation focuses on the oven only

### Core Format Structure

```typescript
interface ChefIQRecipeExport {
  // Recipe Metadata
  recipe_id: string;
  recipe_number: number;
  name: string;
  description: string;
  device_used: "CQ50";
  appliance_id: "cq50" | null;

  // Timing
  active_time: number; // seconds
  total_time: number; // seconds

  // Recipe Details
  difficulty_level: "Easy" | "Medium" | "Hard";
  yield_number: number;
  yield_type: "servings";

  // Timestamps
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601

  // Media
  cover_photo: string | null;
  cover_video: string | null;

  // Status
  status: "approved";

  // Related Data
  appliance: AppllianceInfo;
  devices: DeviceInfo[];
  ingredients: Ingredient[];
  sections: Section[];
  steps: Step[];
}

interface Section {
  section_recipe_id: string; // UUID
  section_id: string; // UUID
  recipe_id: string; // UUID
  order: number;
  name: "Prep" | "Cook" | "Serve";
  steps_ids: string[]; // Array of step UUIDs
  steps: number[]; // Array of step indices (0-based)

  // Cooking actions for this section
  sections_recipes_actions: SectionRecipeAction[];

  // Conditions (like preheat_done)
  sections_recipes_conditions: SectionRecipeCondition[];

  section: {
    section_id: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
}

interface SectionRecipeAction {
  section_recipe_action_id: string; // UUID
  section_recipe_id: string; // UUID
  action_id: string; // UUID from device actions
  order: number;
  value: {
    command: "start_cooking_func" | "end_cooking_func";
    properties: {
      cooking_func_id: string; // e.g., "Bake 1", "Air Fry 1"
      // For start_cooking_func:
      cooking_method?: string; // e.g., "METHOD_BAKE", "METHOD_AIR_FRY"
      target_cavity_temp?: number; // Fahrenheit
      target_probe_temp?: number; // Fahrenheit
      fan_speed?: string; // "0" (low), "1" (medium), "2" (high)
      rack_position?: string; // "top", "middle", "bottom"
      // No properties for end_cooking_func except cooking_func_id
    };
  };
}

interface SectionRecipeCondition {
  section_recipe_condition_id: string; // UUID
  section_recipe_id: string; // UUID
  condition_id: string; // UUID
  order: number;
  value: {
    code: "start_condition";
    properties: {
      condition: "preheat_done";
      cooking_func_id: string; // Reference to the cooking function
    };
  };
}

interface Step {
  step_id: string; // UUID
  step_number: number; // 1-based
  recipe_id: string; // UUID
  section_recipe_id: string; // UUID
  section_id: string; // UUID
  description: string;
  has_timer: 0 | 1;
  smart: 0 | 1;
  ingredients: string[]; // Array of ingredient_recipe_id
  steps_actions: any[]; // Usually empty
  steps_conditions: any[]; // Usually empty
}

interface Ingredient {
  ingredient_recipe_id: string; // UUID
  recipe_id: string; // UUID
  name: string;
  amount: number;
  unit: string; // "cup", "tablespoons", "teaspoon", etc.
  unit_abbreviation: string; // "cup", "Tbsp", "tsp", etc.
  additional_info: string; // "melted", "beaten", "chopped", etc.
  optional_info: string;
  is_main: 0 | 1;
  order: number;
}
```

## Implementation Plan

### Section Auto-Generation Strategy

Since Recipe Studio doesn't have sections, we'll auto-generate them:

1. **Prep Section** - All steps before the first cooking action
2. **Cook Section** - Steps with cooking actions + steps immediately after until cooking ends
3. **Serve Section** - Final steps after cooking is complete

### Cooking Method Mapping

Map Recipe Studio cooking methods to ChefIQ format:

```typescript
const COOKING_METHOD_MAP = {
  // OvenMethod from Recipe Studio -> ChefIQ format
  "0": "METHOD_BAKE",      // Bake
  "1": "METHOD_AIR_FRY",   // Air Fry
  "2": "METHOD_ROAST",     // Roast
  "3": "METHOD_BROIL",     // Broil
  "4": "METHOD_TOAST",     // Toast
  "5": "METHOD_DEHYDRATE", // Dehydrate
};

const ACTION_IDS = {
  BAKE: "3f6500ef-c678-432d-8efc-7ea9d04e3812",
  AIR_FRY: "c6b0dc4c-e6ba-499e-aa9e-9055b155a815",
  ROAST: "15340730-2f58-4f1e-b421-b04876830c47",
  BROIL: "64cd4391-a6ed-4daf-b463-5e50c57694ed",
  TOAST: "4b6cce04-5266-4e37-ad2a-c14c73f84c79",
  DEHYDRATE: "1177454b-d451-4cce-abca-feac01517cbe",
  END_COOKING: "1177454b-d451-4cce-abca-feac01517cbe",
};

const PREHEAT_CONDITION_ID = "9eaf4552-8b80-4f6f-a6de-455194d916ad";
```

### Phase 1: Export Utility Function

Create a new utility module: `src/utils/chefiqExport.ts`

**Functions to implement:**

1. **`exportToChefIQFormat(recipe: Recipe): ChefIQRecipeExport`**
   - Convert Recipe Studio format to ChefIQ legacy format
   - Auto-generate sections (Prep, Cook, Serve)
   - Transform cooking actions with proper start/end commands
   - Generate all required UUIDs

2. **`validateChefIQExport(exportData: ChefIQRecipeExport): ValidationResult`**
   - Validate required fields
   - Check cooking action parameters
   - Ensure proper start/end cooking function chain

3. **`generateExportJSON(recipe: Recipe): string`**
   - Generate formatted JSON string
   - Pretty-print for readability
   - Include export timestamp

**Full implementation:**

```typescript
// src/utils/chefiqExport.ts

import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '~/types/recipe';
import { CookingAction } from '~/types/chefiq';
import { OvenMethod } from '~/types/cookingEnums';

// Constants
const COOKING_METHOD_MAP: Record<string, string> = {
  "0": "METHOD_BAKE",
  "1": "METHOD_AIR_FRY",
  "2": "METHOD_ROAST",
  "3": "METHOD_BROIL",
  "4": "METHOD_TOAST",
  "5": "METHOD_DEHYDRATE",
};

const METHOD_NAMES: Record<string, string> = {
  "0": "Bake",
  "1": "Air Fry",
  "2": "Roast",
  "3": "Broil",
  "4": "Toast",
  "5": "Dehydrate",
};

const ACTION_IDS: Record<string, string> = {
  "0": "3f6500ef-c678-432d-8efc-7ea9d04e3812", // BAKE
  "1": "c6b0dc4c-e6ba-499e-aa9e-9055b155a815", // AIR_FRY
  "2": "15340730-2f58-4f1e-b421-b04876830c47", // ROAST
  "3": "64cd4391-a6ed-4daf-b463-5e50c57694ed", // BROIL
  "4": "4b6cce04-5266-4e37-ad2a-c14c73f84c79", // TOAST
  "5": "1177454b-d451-4cce-abca-feac01517cbe", // DEHYDRATE
  END_COOKING: "1177454b-d451-4cce-abca-feac01517cbe",
};

const PREHEAT_CONDITION_ID = "9eaf4552-8b80-4f6f-a6de-455194d916ad";

const DEVICE_INFO = {
  model_number: "CQ50",
  category_id: "4a3cd4f1-839b-4f45-80ea-08f594ff74c3",
  name: "iQ MiniOven",
  short_code: "50",
  type: "appliance",
  icon: "https://assets.chefiq.com/icons/devices/iQMiniOven.png",
};

/**
 * Export Recipe Studio recipe to ChefIQ legacy format (CQ50 only)
 */
export function exportToChefIQFormat(recipe: Recipe) {
  const now = new Date().toISOString();
  const recipeId = uuidv4();
  const recipeNumber = Math.floor(Math.random() * 1000000);

  // Parse and prepare ingredients
  const ingredients = parseIngredients(recipe.ingredients, recipeId);

  // Determine sections based on cooking actions
  const { sections, steps } = generateSectionsAndSteps(
    recipe,
    recipeId,
    ingredients,
    now
  );

  // Build final export object
  const exportData = {
    recipe_id: recipeId,
    created_by: null,
    updated_by: null,
    created_at: now,
    updated_at: now,
    recipe_number: recipeNumber,
    name: recipe.title,
    description: recipe.description || '',
    device_used: "CQ50" as const,
    appliance_id: "cq50",
    active_time: estimateActiveTime(recipe),
    total_time: recipe.cookTime * 60,
    difficulty_level: capitalizeFirst(recipe.difficulty || 'Medium'),
    default_yield_id: null,
    yield_number: recipe.servings,
    yield_type: "servings" as const,
    cover_photo: recipe.image || null,
    cover_video: null,
    cover_trailer: null,
    status: "approved" as const,
    total_likes: 0,
    has_precooked_ingredients: 0,
    recipe_developer_id: null,
    appliance: {
      appliance_id: "cq50",
      name: "ChefIQ CQ50 Mini Oven",
    },
    devices: [DEVICE_INFO],
    default_yield: null,
    comments: [],
    details: [],
    ingredients,
    ingredient_sections: [],
    howtos: [],
    likes: [],
    kitchen_insights: [],
    sections,
    steps,
  };

  return exportData;
}

/**
 * Parse Recipe Studio ingredients to ChefIQ format (simplified)
 */
function parseIngredients(ingredients: string[], recipeId: string) {
  return ingredients.map((ingredient, index) => {
    const parsed = parseIngredientString(ingredient);

    return {
      ingredient_id: uuidv4(),
      name: parsed.name,
      name_plural: `${parsed.name}s`,
      unit_id: uuidv4(),
      type: "base" as const,
      status: "approved" as const,
      unit: parsed.unit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ingredient_recipe_id: uuidv4(),
      recipe_id: recipeId,
      step_id: null, // Will be linked later
      amount: parsed.amount,
      optional_info: parsed.optional || "",
      is_main: index < 3 ? 1 : 0, // First 3 ingredients are "main"
      order: index + 1,
      unit_abbreviation: getUnitAbbreviation(parsed.unit),
      additional_info: parsed.additional || "",
      fraction: parsed.fraction || "",
    };
  });
}

/**
 * Parse ingredient string: "2 cups flour" -> {amount: 2, unit: "cups", name: "flour"}
 */
function parseIngredientString(ingredient: string) {
  // Match patterns like: "2 cups flour", "1/2 tsp salt", "3 chicken breasts, boneless"
  const match = ingredient.match(/^([\d\s\/]+)\s*([a-zA-Z]+)?\s+(.+)$/);

  if (match) {
    const amountStr = match[1].trim();
    const unit = match[2] || "cup";
    const nameAndInfo = match[3];

    // Parse fraction or decimal
    let amount = 1;
    let fraction = "";
    if (amountStr.includes('/')) {
      fraction = amountStr;
      const [num, den] = amountStr.split('/').map(n => parseFloat(n.trim()));
      amount = num / den;
    } else {
      amount = parseFloat(amountStr);
    }

    // Separate name from additional info (e.g., "chicken, boneless")
    const [name, ...additionalParts] = nameAndInfo.split(',');
    const additional = additionalParts.join(',').trim();

    return {
      amount,
      unit,
      name: name.trim(),
      additional,
      optional: "",
      fraction,
    };
  }

  // No quantity detected - treat as single item
  return {
    amount: 1,
    unit: "cup",
    name: ingredient,
    additional: "",
    optional: "",
    fraction: "",
  };
}

/**
 * Get abbreviated unit name
 */
function getUnitAbbreviation(unit: string): string {
  const abbrevMap: Record<string, string> = {
    tablespoons: "Tbsp",
    tablespoon: "Tbsp",
    teaspoons: "tsp",
    teaspoon: "tsp",
    cups: "cup",
    cup: "cup",
    ounces: "oz",
    ounce: "oz",
    pounds: "lb",
    pound: "lb",
    grams: "g",
    gram: "g",
    liters: "L",
    liter: "L",
  };
  return abbrevMap[unit.toLowerCase()] || unit;
}

/**
 * Generate sections and steps with proper cooking actions
 */
function generateSectionsAndSteps(
  recipe: Recipe,
  recipeId: string,
  ingredients: any[],
  now: string
) {
  const cookingActions = recipe.cookingActions || [];

  // Find where cooking starts and ends
  const firstCookingStepIndex = cookingActions.length > 0
    ? Math.min(...cookingActions.map(a => a.stepIndex || 0))
    : recipe.steps.length;

  const lastCookingStepIndex = cookingActions.length > 0
    ? Math.max(...cookingActions.map(a => a.stepIndex || 0))
    : -1;

  // Generate section IDs
  const prepSectionId = uuidv4();
  const cookSectionId = uuidv4();
  const serveSectionId = uuidv4();

  const prepSectionRecipeId = uuidv4();
  const cookSectionRecipeId = uuidv4();
  const serveSectionRecipeId = uuidv4();

  // Prepare all steps with IDs
  const allSteps = recipe.steps.map((step, index) => {
    const stepId = uuidv4();
    let sectionId: string;
    let sectionRecipeId: string;

    if (index < firstCookingStepIndex) {
      sectionId = prepSectionId;
      sectionRecipeId = prepSectionRecipeId;
    } else if (index <= lastCookingStepIndex) {
      sectionId = cookSectionId;
      sectionRecipeId = cookSectionRecipeId;
    } else {
      sectionId = serveSectionId;
      sectionRecipeId = serveSectionRecipeId;
    }

    return {
      step_id: stepId,
      created_at: now,
      updated_at: now,
      step_number: index + 1,
      recipe_id: recipeId,
      section_recipe_id: sectionRecipeId,
      section_id: sectionId,
      description: step.text || '',
      has_timer: 0,
      smart: 0,
      steps_actions: [],
      steps_conditions: [],
      ingredients: [], // Could link ingredients here
    };
  });

  // Generate sections with cooking actions
  const sections = [];

  // 1. PREP SECTION
  const prepSteps = allSteps.filter(s => s.section_id === prepSectionId);
  if (prepSteps.length > 0) {
    const prepSection = createSection({
      sectionRecipeId: prepSectionRecipeId,
      sectionId: prepSectionId,
      recipeId,
      order: 1,
      name: "Prep",
      steps: prepSteps,
      now,
      cookingActions: cookingActions.length > 0 ? [cookingActions[0]] : [], // Start cooking in prep
      sectionType: 'prep',
    });
    sections.push(prepSection);
  }

  // 2. COOK SECTION
  const cookSteps = allSteps.filter(s => s.section_id === cookSectionId);
  if (cookSteps.length > 0) {
    const cookSection = createSection({
      sectionRecipeId: cookSectionRecipeId,
      sectionId: cookSectionId,
      recipeId,
      order: 2,
      name: "Cook",
      steps: cookSteps,
      now,
      cookingActions: [], // No actions needed in Cook section
      sectionType: 'cook',
    });
    sections.push(cookSection);
  }

  // 3. SERVE SECTION
  const serveSteps = allSteps.filter(s => s.section_id === serveSectionId);
  if (serveSteps.length > 0) {
    const serveSection = createSection({
      sectionRecipeId: serveSectionRecipeId,
      sectionId: serveSectionId,
      recipeId,
      order: 3,
      name: "Serve",
      steps: serveSteps,
      now,
      cookingActions: cookingActions.length > 0 ? [cookingActions[0]] : [], // End cooking
      sectionType: 'serve',
    });
    sections.push(serveSection);
  }

  return { sections, steps: allSteps };
}

/**
 * Create a section object with proper actions (conditions ignored)
 */
function createSection(params: {
  sectionRecipeId: string;
  sectionId: string;
  recipeId: string;
  order: number;
  name: string;
  steps: any[];
  now: string;
  cookingActions: CookingAction[];
  sectionType: 'prep' | 'cook' | 'serve';
}) {
  const {
    sectionRecipeId,
    sectionId,
    recipeId,
    order,
    name,
    steps,
    now,
    cookingActions,
    sectionType,
  } = params;

  const section: any = {
    section_recipe_id: sectionRecipeId,
    created_by: null,
    updated_by: null,
    created_at: now,
    updated_at: now,
    section_id: sectionId,
    recipe_id: recipeId,
    recipe_yield_id: null,
    duration: null,
    model_number: null,
    order,
    type: null,
    sections_recipes_actions: [],
    sections_recipes_conditions: [],
    name,
    steps_ids: steps.map(s => s.step_id),
    steps: steps.map((_, i) => order === 1 ? i : (order === 2 ? i + steps.length : i + steps.length * 2)),
    section: {
      section_id: sectionId,
      name,
      created_at: now,
      updated_at: now,
    },
  };

  // Add cooking actions based on section type
  if (sectionType === 'prep' && cookingActions.length > 0) {
    // Start cooking function in prep
    const action = cookingActions[0];
    section.sections_recipes_actions.push(
      createStartCookingAction(action, sectionRecipeId, now)
    );
  } else if (sectionType === 'serve' && cookingActions.length > 0) {
    // End cooking function in serve
    const action = cookingActions[0];
    section.sections_recipes_actions.push(
      createEndCookingAction(action, sectionRecipeId, now)
    );
  }
  // Note: sections_recipes_conditions (like preheat_done) can be ignored

  return section;
}

/**
 * Create start_cooking_func action
 */
function createStartCookingAction(
  action: CookingAction,
  sectionRecipeId: string,
  now: string
) {
  const methodId = action.methodId;
  const methodName = METHOD_NAMES[methodId] || "Bake";
  const cookingMethod = COOKING_METHOD_MAP[methodId] || "METHOD_BAKE";

  const properties: any = {
    cooking_func_id: getCookingFuncId(action),
    cooking_method: cookingMethod,
  };

  // Add parameters based on method
  if (action.parameters.target_cavity_temp) {
    properties.target_cavity_temp = action.parameters.target_cavity_temp;
  }
  if (action.parameters.target_probe_temp) {
    properties.target_probe_temp = action.parameters.target_probe_temp;
  }
  if (action.parameters.fan_speed !== undefined) {
    properties.fan_speed = String(action.parameters.fan_speed);
  } else {
    properties.fan_speed = "1"; // Default medium
  }

  properties.rack_position = "middle"; // Default

  return {
    section_recipe_action_id: uuidv4(),
    created_at: now,
    updated_at: now,
    section_recipe_id: sectionRecipeId,
    action_id: ACTION_IDS[methodId] || ACTION_IDS["0"],
    value: {
      command: "start_cooking_func",
      properties,
    },
    order: 1,
  };
}

/**
 * Create end_cooking_func action
 */
function createEndCookingAction(
  action: CookingAction,
  sectionRecipeId: string,
  now: string
) {
  return {
    section_recipe_action_id: uuidv4(),
    created_at: now,
    updated_at: now,
    section_recipe_id: sectionRecipeId,
    action_id: ACTION_IDS.END_COOKING,
    value: {
      command: "end_cooking_func",
      properties: {
        cooking_func_id: getCookingFuncId(action),
      },
    },
    order: 1,
  };
}

/**
 * Generate cooking function ID
 */
function getCookingFuncId(action: CookingAction): string {
  const methodName = METHOD_NAMES[action.methodId] || "Bake";
  return `${methodName} 1`;
}

/**
 * Estimate active time (prep time) in seconds
 */
function estimateActiveTime(recipe: Recipe): number {
  // Rough estimate: 10 minutes per step
  return recipe.steps.length * 600;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Validate export data
 */
export function validateChefIQExport(exportData: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!exportData.name) errors.push('Recipe name is required');
  if (!exportData.yield_number || exportData.yield_number < 1) {
    errors.push('Valid servings count required');
  }
  if (!exportData.ingredients || exportData.ingredients.length === 0) {
    errors.push('At least one ingredient is required');
  }
  if (!exportData.steps || exportData.steps.length === 0) {
    errors.push('At least one step is required');
  }
  if (!exportData.sections || exportData.sections.length === 0) {
    errors.push('At least one section is required');
  }

  // Validate sections have proper actions
  const hasStartCooking = exportData.sections.some(
    (s: any) => s.sections_recipes_actions.some(
      (a: any) => a.value.command === 'start_cooking_func'
    )
  );

  if (!hasStartCooking) {
    errors.push('Recipe must have at least one cooking action');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate export JSON string
 */
export function generateExportJSON(recipe: Recipe): string {
  const exportData = exportToChefIQFormat(recipe);
  const validation = validateChefIQExport(exportData);

  if (!validation.valid) {
    throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
  }

  return JSON.stringify(exportData, null, 2);
}
```

**Note:** This requires installing the `uuid` package:
```bash
npm install uuid
npm install --save-dev @types/uuid
```

**Implementation Notes:**
- ✅ `sections_recipes_actions` with `start_cooking_func` and `end_cooking_func` are implemented
- ⚠️ `sections_recipes_conditions` (like `preheat_done`) are **optional** and can be ignored for basic functionality
- ✅ Ingredients are simplified with basic parsing from Recipe Studio text format
- ✅ Auto-generation of Prep, Cook, and Serve sections based on cooking action locations
- ✅ Only CQ50 Mini Oven is supported in this implementation

### Phase 2: UI Components

Create export functionality in the Recipe Detail screen:

**Location:** `src/screens/recipeDetail.tsx`

**Features:**
1. "Export to ChefIQ" button in recipe detail view
2. Export modal with preview
3. Share/save options (share sheet, save to files, copy to clipboard)
4. Export validation feedback

**Example UI implementation:**

```typescript
// In RecipeDetail screen

const handleExportToChefIQ = async () => {
  try {
    // Generate export
    const exportJSON = generateExportJSON(recipe);

    // Show preview modal
    setExportPreview(exportJSON);
    setShowExportModal(true);
  } catch (error) {
    Alert.alert('Export Failed', error.message);
  }
};

const handleShareExport = async () => {
  try {
    const exportJSON = generateExportJSON(recipe);

    // Use React Native Share API
    await Share.share({
      message: exportJSON,
      title: `${recipe.title} - ChefIQ Recipe`,
    });
  } catch (error) {
    console.error('Share failed:', error);
  }
};

// Add export button
<TouchableOpacity
  style={styles.exportButton}
  onPress={handleExportToChefIQ}
>
  <Feather name="download" size={20} color="#fff" />
  <Text style={styles.exportButtonText}>Export to ChefIQ</Text>
</TouchableOpacity>
```

### Phase 3: Export Modal Component

Create a new modal component for export preview and sharing:

**File:** `src/components/ChefIQExportModal.tsx`

**Features:**
- JSON preview with syntax highlighting
- Export validation status indicator
- Copy to clipboard button
- Share button (iOS/Android share sheet)
- Save to files button
- QR code generation (optional, for easy device pairing)

### Phase 4: Testing & Validation

**Test Cases:**

1. **Export validation**
   - Export recipe with all fields
   - Export recipe with minimal fields
   - Export recipe with multiple cooking actions
   - Export recipe without cooking actions

2. **Appliance compatibility**
   - Export cooker recipes (RJ40)
   - Export oven recipes (CQ50)
   - Export mixed appliance recipes

3. **Parameter validation**
   - Verify temperature parameters
   - Verify time parameters
   - Verify probe temperature settings
   - Verify pressure cooking settings

4. **Share functionality**
   - Share via iOS share sheet
   - Share via Android share sheet
   - Copy to clipboard
   - Save to files

5. **Device testing** (if ChefIQ devices available)
   - Import exported recipe on RJ40
   - Import exported recipe on CQ50
   - Execute guided cooking
   - Verify all steps work correctly

## Export Format Examples

### Example 1: Pressure Cooker Recipe

```json
{
  "recipe_id": "recipe_123",
  "recipe_name": "Quick Chicken Soup",
  "recipe_description": "Healthy chicken soup made in minutes",
  "servings": 4,
  "cook_time_minutes": 20,
  "difficulty_level": "easy",
  "ingredients": [
    { "quantity": "1", "unit": "lb", "item": "chicken breast" },
    { "quantity": "4", "unit": "cups", "item": "chicken broth" },
    { "quantity": "2", "item": "carrots, chopped" }
  ],
  "instructions": [
    {
      "step_number": 1,
      "instruction_text": "Add all ingredients to the cooker",
      "cooking_action": {
        "action_id": "action_1",
        "action_name": "Pressure Cook",
        "appliance_id": "cooker",
        "method_id": "0",
        "parameters": {
          "cooking_method": 0,
          "cooking_time": 1200,
          "pres_level": 0,
          "pres_release": 1,
          "keep_warm": 1,
          "delay_time": 0
        }
      }
    }
  ],
  "appliance": {
    "category_id": "cooker",
    "category_name": "iQ Smart Cooker"
  },
  "exported_at": "2025-10-20T10:30:00.000Z",
  "exported_from": "Recipe Studio by ChefIQ"
}
```

### Example 2: Air Fry Recipe

```json
{
  "recipe_id": "recipe_456",
  "recipe_name": "Crispy Chicken Wings",
  "recipe_description": "Perfectly crispy wings without deep frying",
  "servings": 3,
  "cook_time_minutes": 25,
  "difficulty_level": "easy",
  "ingredients": [
    { "quantity": "2", "unit": "lbs", "item": "chicken wings" },
    { "quantity": "2", "unit": "tbsp", "item": "olive oil" },
    { "quantity": "1", "unit": "tsp", "item": "garlic powder" }
  ],
  "instructions": [
    {
      "step_number": 1,
      "instruction_text": "Toss wings with oil and seasonings"
    },
    {
      "step_number": 2,
      "instruction_text": "Air fry until golden and crispy",
      "cooking_action": {
        "action_id": "action_1",
        "action_name": "Air Fry",
        "appliance_id": "oven",
        "method_id": "1",
        "parameters": {
          "cooking_time": 1500,
          "target_cavity_temp": 400,
          "fan_speed": 2,
          "target_probe_temp": 165
        }
      }
    }
  ],
  "appliance": {
    "category_id": "oven",
    "category_name": "iQ MiniOven"
  },
  "exported_at": "2025-10-20T11:00:00.000Z",
  "exported_from": "Recipe Studio by ChefIQ"
}
```

## File Locations

```
src/
├── utils/
│   └── chefiqExport.ts          # Export utility functions
├── components/
│   └── ChefIQExportModal.tsx    # Export preview modal
├── screens/
│   └── recipeDetail.tsx         # Add export button
└── __tests__/
    └── chefiqExport.test.ts     # Export unit tests
```

## Dependencies

No new dependencies required. Uses existing:
- `react-native` Share API
- `expo-sharing` for file sharing
- `expo-clipboard` for clipboard functionality

## Success Criteria

1. ✅ Successfully generate ChefIQ-compatible JSON from Recipe Studio recipes
2. ✅ Validate export format against ChefIQ requirements
3. ✅ Support both cooker and oven appliance exports
4. ✅ Include all cooking actions with correct parameters
5. ✅ Provide user-friendly export/share UI
6. ✅ (Optional) Test with actual ChefIQ devices

## Future Enhancements

- **QR Code Generation**: Generate QR codes for easy device pairing
- **Direct Device Upload**: API integration to upload directly to ChefIQ devices
- **Export History**: Track exported recipes
- **Batch Export**: Export multiple recipes at once
- **Export Templates**: Custom export formats for different use cases

---

*Document Created: October 20, 2025*
*Status: Planning Phase*
