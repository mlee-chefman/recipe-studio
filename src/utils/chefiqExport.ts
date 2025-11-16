// src/utils/chefiqExport.ts

import * as Crypto from 'expo-crypto';
import { Recipe } from '~/types/recipe';
import { CookingAction, getApplianceById } from '~/types/chefiq';

// UUID generator using expo-crypto
const uuidv4 = () => Crypto.randomUUID();

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

// Device information mapping for different appliances
const DEVICE_INFO_MAP: Record<string, any> = {
  // CQ50 Mini Oven
  "4a3cd4f1-839b-4f45-80ea-08f594ff74c3": {
    model_number: "CQ50",
    category_id: "4a3cd4f1-839b-4f45-80ea-08f594ff74c3",
    name: "iQ MiniOven",
    short_code: "50",
    type: "appliance",
    icon: "https://assets.chefiq.com/icons/devices/iQMiniOven.png",
  },
  // RJ40 Smart Cooker
  "c8ff3aef-3de6-4a74-bba6-03e943b2762c": {
    model_number: "RJ40-6-WIFI",
    category_id: "c8ff3aef-3de6-4a74-bba6-03e943b2762c",
    name: "iQ Cooker",
    short_code: "SC",
    type: "appliance",
    icon: "https://assets.chefiq.com/icons/devices/iQCooker.png",
  },
};

/**
 * Get device information for a specific appliance
 */
function getDeviceInfo(applianceCategoryId: string) {
  return DEVICE_INFO_MAP[applianceCategoryId] || DEVICE_INFO_MAP["4a3cd4f1-839b-4f45-80ea-08f594ff74c3"];
}

/**
 * Export Recipe Studio recipe to ChefIQ legacy format
 * Supports both RJ40 Smart Cooker and CQ50 Mini Oven
 */
export function exportToChefIQFormat(recipe: Recipe) {
  const now = new Date().toISOString();
  const recipeId = uuidv4();
  const recipeNumber = Math.floor(Math.random() * 1000000);

  // Get appliance information
  if (!recipe.chefiqAppliance) {
    throw new Error('Recipe must have a ChefIQ appliance assigned');
  }

  const appliance = getApplianceById(recipe.chefiqAppliance);
  if (!appliance) {
    throw new Error('Invalid ChefIQ appliance');
  }

  const deviceInfo = getDeviceInfo(recipe.chefiqAppliance);
  const applianceIdLowercase = deviceInfo.model_number.toLowerCase();

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
    device_used: deviceInfo.model_number,
    appliance_id: applianceIdLowercase,
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
      appliance_id: applianceIdLowercase,
      name: appliance.name,
    },
    devices: [deviceInfo],
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
  // Extract cooking actions from steps
  const cookingActions: CookingAction[] = [];
  recipe.steps.forEach((step, index) => {
    if (step.cookingAction) {
      cookingActions.push({
        ...step.cookingAction,
        stepIndex: index,
      });
    }
  });

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

    // Check if this step has a cooking action - if so, mark it as smart
    const hasCookingAction = !!step.cookingAction;

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
      smart: hasCookingAction ? 1 : 0,
      steps_actions: [],
      steps_conditions: [],
      ingredients: [], // Could link ingredients here
    };
  });

  // Generate sections with cooking actions
  const sections = [];
  const prepSteps = allSteps.filter(s => s.section_id === prepSectionId);
  const cookSteps = allSteps.filter(s => s.section_id === cookSectionId);
  const serveSteps = allSteps.filter(s => s.section_id === serveSectionId);

  // Determine which sections should have start/end cooking actions
  const hasPrep = prepSteps.length > 0;
  const hasCook = cookSteps.length > 0;
  const hasServe = serveSteps.length > 0;

  // Start cooking in the first section that exists
  const startCookingInPrep = hasPrep;
  const startCookingInCook = !hasPrep && hasCook;

  // End cooking in the last section that exists
  const endCookingInServe = hasServe;
  const endCookingInCook = !hasServe && hasCook;

  let sectionOrder = 1;

  // 1. PREP SECTION
  if (prepSteps.length > 0) {
    const prepSection = createSection({
      sectionRecipeId: prepSectionRecipeId,
      sectionId: prepSectionId,
      recipeId,
      order: sectionOrder++,
      name: "Prep",
      steps: prepSteps,
      now,
      cookingActions: startCookingInPrep && cookingActions.length > 0 ? [cookingActions[0]] : [],
      sectionType: 'prep',
    });
    sections.push(prepSection);
  }

  // 2. COOK SECTION
  if (cookSteps.length > 0) {
    const cookSection = createSection({
      sectionRecipeId: cookSectionRecipeId,
      sectionId: cookSectionId,
      recipeId,
      order: sectionOrder++,
      name: "Cook",
      steps: cookSteps,
      now,
      cookingActions: (startCookingInCook || endCookingInCook) && cookingActions.length > 0 ? [cookingActions[0]] : [],
      sectionType: startCookingInCook ? 'prep' : (endCookingInCook ? 'serve' : 'cook'),
    });
    sections.push(cookSection);
  }

  // 3. SERVE SECTION
  if (serveSteps.length > 0) {
    const serveSection = createSection({
      sectionRecipeId: serveSectionRecipeId,
      sectionId: serveSectionId,
      recipeId,
      order: sectionOrder++,
      name: "Serve",
      steps: serveSteps,
      now,
      cookingActions: endCookingInServe && cookingActions.length > 0 ? [cookingActions[0]] : [],
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

  // Note: Cooking actions are optional - recipes can be exported without smart cooking features

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
