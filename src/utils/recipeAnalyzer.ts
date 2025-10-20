import * as Crypto from 'expo-crypto';
import { CHEFIQ_APPLIANCES, CookingAction } from '~/types/chefiq';
import { Step } from '~/types/recipe';

// UUID generator using expo-crypto
const uuidv4 = () => Crypto.randomUUID();
import {
  FanSpeed,
  TemperatureLevel,
  PressureLevel,
  PressureRelease,
  KeepWarm,
  ShadeLevel,
  CookerMethod,
  OvenMethod
} from '~/types/cookingEnums';

import { detectProteinType, getUsdaRecommendedTemp } from '@constants/temperatureGuide';

interface CookingMethodKeywords {
  methodId: string | number;
  applianceType: 'cooker' | 'oven';
  keywords: string[];
  defaultParams: any;
  estimatedTime?: number;
}

// Keywords and patterns for detecting cooking methods
const COOKING_METHOD_PATTERNS: CookingMethodKeywords[] = [
  // iQ Cooker (RJ40) Methods
  {
    methodId: CookerMethod.Pressure,
    applianceType: 'cooker',
    keywords: ['pressure cook', 'instant pot', 'pressure cooker', 'quick cook', 'high pressure'],
    defaultParams: {
      cooking_method: CookerMethod.Pressure,
      pres_level: PressureLevel.High,
      pres_release: PressureRelease.Quick,
      keep_warm: KeepWarm.On,
      delay_time: 0,
    },
    estimatedTime: 15
  },
  {
    methodId: CookerMethod.SearSaute,
    applianceType: 'cooker',
    keywords: ['sauté', 'saute', 'brown', 'sear', 'fry', 'cook until golden', 'cook over medium heat', 'cook over high heat'],
    defaultParams: {
      cooking_method: CookerMethod.SearSaute,
      temp_level: TemperatureLevel.MediumLow,
      keep_warm: KeepWarm.Off,
      delay_time: 0,
    },
    estimatedTime: 10
  },
  {
    methodId: CookerMethod.Steam,
    applianceType: 'cooker',
    keywords: ['steam', 'steamer', 'steam basket', 'steamed'],
    defaultParams: {
      cooking_method: CookerMethod.Steam,
      keep_warm: KeepWarm.Off,
      delay_time: 0,
    },
    estimatedTime: 15
  },
  {
    methodId: CookerMethod.SlowCook,
    applianceType: 'cooker',
    keywords: ['slow cook', 'slow cooker', 'crock pot', 'low and slow', 'simmer'],
    defaultParams: {
      cooking_method: CookerMethod.SlowCook,
      temp_level: TemperatureLevel.High,
      keep_warm: KeepWarm.On,
      delay_time: 0,
    },
    estimatedTime: 240
  },
  {
    methodId: CookerMethod.SousVide,
    applianceType: 'cooker',
    keywords: ['sous vide', 'water bath', 'vacuum seal'],
    defaultParams: {
      cooking_method: CookerMethod.SousVide,
      delay_time: 0,
    },
    estimatedTime: 120
  },

  // iQ MiniOven (CQ50) Methods
  {
    methodId: OvenMethod.Bake,
    applianceType: 'oven',
    keywords: ['bake', 'baking', 'oven', 'baked', 'preheat'],
    defaultParams: {
      cooking_time: 1800, // 30 minutes
      target_cavity_temp: 350, // Will be overridden by extracted temp
      fan_speed: FanSpeed.Low,
    },
    estimatedTime: 30
  },
  {
    methodId: OvenMethod.AirFry,
    applianceType: 'oven',
    keywords: ['air fry', 'air fryer', 'crispy', 'crunchy', 'air-fry'],
    defaultParams: {
      cooking_time: 900, // 15 minutes
      target_cavity_temp: 375,
      fan_speed: FanSpeed.High,
    },
    estimatedTime: 15
  },
  {
    methodId: OvenMethod.Roast,
    applianceType: 'oven',
    keywords: ['roast', 'roasted', 'roasting'],
    defaultParams: {
      cooking_time: 2700, // 45 minutes
      target_cavity_temp: 400,
      fan_speed: FanSpeed.Low,
    },
    estimatedTime: 45
  },
  {
    methodId: OvenMethod.Broil,
    applianceType: 'oven',
    keywords: ['broil', 'broiled', 'broiling', 'grill', 'grilled', 'char', 'outdoor grill', 'preheated grill', 'barbecue', 'bbq'],
    defaultParams: {
      cooking_time: 600, // 10 minutes
      temp_level: TemperatureLevel.High,
    },
    estimatedTime: 10
  },
  {
    methodId: OvenMethod.Toast,
    applianceType: 'oven',
    keywords: ['toast', 'toasted', 'toasting', 'golden brown'],
    defaultParams: {
      cooking_time: 180, // 3 minutes
      shade_level: ShadeLevel.Medium,
    },
    estimatedTime: 3
  },
  {
    methodId: OvenMethod.Dehydrate,
    applianceType: 'oven',
    keywords: ['dehydrate', 'dehydrating', 'dehydrator', 'make jerky', 'beef jerky', 'dried fruit', 'drying fruit', 'fruit leather'],
    defaultParams: {
      cooking_time: 28800, // 8 hours
      target_cavity_temp: 135,
    },
    estimatedTime: 480
  }
];

// Temperature keywords for probe detection
const PROBE_KEYWORDS = [
  'internal temperature', 'probe', 'thermometer', 'until cooked through',
  'meat thermometer', 'doneness', 'internal temp', 'reaches temperature',
  'cook until', 'temp probe', 'temperature probe'
];

// Keywords for detecting remove temperature (carryover cooking/resting)
const REMOVE_TEMP_KEYWORDS = [
  'remove at', 'pull at', 'take out at', 'remove from heat at',
  'pull from', 'rest', 'resting', 'carryover', 'carry over',
  'let rest', 'allow to rest', 'remove when'
];

// Proteins that benefit from carryover cooking (large cuts)
const CARRYOVER_PROTEINS = [
  'steak', 'beef', 'roast', 'prime rib', 'brisket', 'pork loin',
  'pork chop', 'lamb', 'turkey', 'whole chicken', 'chicken breast',
  'duck breast', 'venison', 'tenderloin'
];

// Legacy fallback temperatures for proteins not in temperature guide
const FALLBACK_PROTEIN_TEMPERATURES: { [key: string]: number } = {
  'salmon': 145,
  'tuna': 145,
  'venison': 145,
  'game': 165,
  'duck': 165,
};

export interface RecipeAnalysisResult {
  suggestedAppliance?: string; // category_id
  suggestedActions: CookingAction[];
  useProbe?: boolean;
  probeTemp?: number;
  confidence: number; // 0-1 score
  reasoning: string[];
}

// Helper function to get protein temperature using temperature guide
const getProteinTemperature = (text: string): number => {
  // Try to detect protein using temperature guide
  const detectedProtein = detectProteinType(text);
  if (detectedProtein) {
    return getUsdaRecommendedTemp(detectedProtein);
  }

  // Fallback to legacy protein detection
  const textLower = text.toLowerCase();
  for (const [protein, temp] of Object.entries(FALLBACK_PROTEIN_TEMPERATURES)) {
    if (textLower.includes(protein)) {
      return temp;
    }
  }

  return 145; // Default safe temperature
};

// Helper function to detect if recipe needs remove temperature (carryover cooking)
const shouldUseRemoveTemp = (text: string): boolean => {
  const textLower = text.toLowerCase();

  // Check for explicit remove temp keywords
  const hasRemoveTempKeywords = REMOVE_TEMP_KEYWORDS.some(keyword => textLower.includes(keyword));

  // Check for carryover cooking proteins
  const hasCarryoverProtein = CARRYOVER_PROTEINS.some(protein => textLower.includes(protein));

  return hasRemoveTempKeywords || hasCarryoverProtein;
};

// Helper function to extract remove temperature from text
const extractRemoveTemperature = (text: string, targetTemp: number): number | null => {
  const textLower = text.toLowerCase();

  // Look for patterns like "remove at 160°F" or "pull at 160 degrees"
  const removeTempPatterns = [
    /(?:remove|pull|take out)(?:\s+(?:at|when|from\s+(?:heat|oven)\s+at))\s+(\d{2,3})\s*(?:°\s*F|degrees\s*F?|°)/gi,
    /(\d{2,3})\s*(?:°\s*F|degrees\s*F?).*?(?:remove|pull|take out)/gi,
  ];

  for (const pattern of removeTempPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      const temp = parseInt(match[1]);
      // Valid remove temp: should be lower than target and within reasonable range
      if (temp >= 100 && temp < targetTemp && temp >= targetTemp - 15) {
        return temp;
      }
    }
  }

  // If no explicit remove temp found but recipe needs it, calculate default
  if (shouldUseRemoveTemp(textLower)) {
    // Default: 5-10°F below target for carryover cooking
    const defaultOffset = targetTemp >= 160 ? 10 : 5;
    return Math.max(100, targetTemp - defaultOffset);
  }

  return null;
};

export const analyzeRecipeForChefIQ = (
  title: string,
  description: string,
  steps: Step[],
  cookTime: number
): RecipeAnalysisResult => {
  try {
    // Filter out storage instructions and notes that might have false positive keywords
    const filteredDescription = description
      .split('\n')
      .filter(line => {
        const lineLower = line.toLowerCase();
        return !lineLower.includes('storage') &&
               !lineLower.includes('store in') &&
               !lineLower.includes('refrigerat') &&
               !lineLower.includes('freezer');
      })
      .join(' ');

    const allText = [title, filteredDescription, ...steps.map(s => s.text)].join(' ');
    const allTextLower = allText.toLowerCase();

    // Check for stovetop-only recipes (no appliance needed)
    // Note: "over medium/high heat" are NOT stovetop-only as they can be done in ChefIQ cooker (sauté mode)
    const stovetopKeywords = ['in a saucepan', 'in a pot', 'in a skillet', 'in a frying pan', 'stove top', 'stovetop', 'on the stove', 'on the burner', 'over low heat', 'bring to a boil', 'bring to boil'];
    const hasStorvetopOnly = stovetopKeywords.some(keyword => allTextLower.includes(keyword));

    // Check if recipe mentions any ChefIQ-compatible methods
    const hasChefIQMethod = COOKING_METHOD_PATTERNS.some(pattern =>
      pattern.keywords.some(keyword => allTextLower.includes(keyword))
    );

    // If it's stovetop-only and doesn't mention any ChefIQ methods, don't suggest appliances
    if (hasStorvetopOnly && !hasChefIQMethod) {
      return {
        suggestedActions: [],
        confidence: 0,
        reasoning: ['Recipe uses stovetop cooking only - no ChefIQ appliance needed.']
      };
    }
    const reasoning: string[] = [];
    const suggestedActions: CookingAction[] = [];

  // Extract temperatures from the recipe text
  const stepTexts = steps.map(s => s.text);

  const extractedTemp = extractTemperature(allText, true); // Prefer initial/preheat temperature
  const temperatureSteps = extractTemperaturesWithContext(stepTexts);

  // Extract cooking time from instructions
  const extractedCookingTime = extractCookingTimeFromInstructions(stepTexts);

  if (extractedTemp) {
    reasoning.push(`Detected initial temperature: ${extractedTemp}°F`);
  }

  if (extractedCookingTime) {
    reasoning.push(`Detected cooking time: ${extractedCookingTime} minutes from instructions`);
  }

  // Check if there are multiple temperature steps
  if (temperatureSteps.length > 1) {
    reasoning.push(`Detected ${temperatureSteps.length} temperature changes in recipe`);
  }

  // Analyze individual instructions for cooking methods
  const instructionAnalysis = stepTexts.map((stepText, index) => {
    const stepLower = stepText.toLowerCase();

    // Special handling: if "increase temperature" is mentioned, it's likely baking, not dehydrating
    let matches = COOKING_METHOD_PATTERNS.filter(pattern => {
      // Skip dehydrate method if we see "increase temperature" or temperature changes
      if (pattern.methodId === OvenMethod.Dehydrate &&
          (stepLower.includes('increase') || stepLower.includes('raise')) &&
          stepLower.includes('temperature')) {
        return false;
      }

      return pattern.keywords.some(keyword => stepLower.includes(keyword));
    });

    // If we detect temperature increase/change, prioritize baking methods
    if ((stepLower.includes('increase') || stepLower.includes('raise')) &&
        stepLower.includes('temperature')) {
      // Add baking method if not already present
      const bakingMethod = COOKING_METHOD_PATTERNS.find(p => p.methodId === OvenMethod.Bake);
      if (bakingMethod && !matches.some(m => m.methodId === OvenMethod.Bake)) {
        matches.push(bakingMethod);
      }
    }

    return { step: stepText, index, matches, text: stepLower, originalText: stepText };
  });

  // Detect primary protein cooking vs auxiliary steps
  const proteinKeywords = ['pork', 'chicken', 'beef', 'lamb', 'fish', 'salmon', 'turkey', 'steak', 'chops'];
  const grillKeywords = ['grill', 'grilled', 'outdoor grill', 'preheated grill', 'grate', 'barbecue', 'bbq'];
  const ovenKeywords = ['oven', 'bake', 'roast', 'broil', 'air fry'];

  // Check for grilling (should suggest oven as substitute)
  const hasGrilling = grillKeywords.some(keyword => allTextLower.includes(keyword));
  const hasProtein = proteinKeywords.some(keyword => allTextLower.includes(keyword));
  const hasTemperatureCheck = allTextLower.includes('degrees') || allTextLower.includes('thermometer') || allTextLower.includes('internal temperature');

  if (hasGrilling && hasProtein) {
    reasoning.push('Detected grilling recipe with protein - suggesting oven as ChefIQ alternative.');

    // For grilled proteins, suggest oven methods (air fry, broil, or bake)
    let suggestedOvenMethod = OvenMethod.AirFry; // Default for crispy results

    if (allTextLower.includes('crispy') || allTextLower.includes('crunchy')) {
      suggestedOvenMethod = OvenMethod.AirFry;
      reasoning.push('Detected need for crispy texture - suggesting Air Fry.');
    } else if (allTextLower.includes('char') || allTextLower.includes('sear') || allTextLower.includes('brown')) {
      suggestedOvenMethod = OvenMethod.Broil;
      reasoning.push('Detected need for browning/searing - suggesting Broil.');
    } else if (cookTime > 20) {
      suggestedOvenMethod = OvenMethod.Bake;
      reasoning.push('Longer cooking time detected - suggesting Bake.');
    }

    const ovenAppliance = CHEFIQ_APPLIANCES.find(a => a.thing_category_name === 'oven');
    if (ovenAppliance) {
      const methodPattern = COOKING_METHOD_PATTERNS.find(p => p.methodId === suggestedOvenMethod);
      if (methodPattern) {
        // Find which instruction step contains grilling keywords
        const grillStepIndex = stepTexts.findIndex(stepText =>
          grillKeywords.some(keyword => stepText.toLowerCase().includes(keyword))
        );

        // Check for remove temp in grilled protein recipes
        let grillRemoveTemp: number | null = null;
        if (hasTemperatureCheck && shouldUseRemoveTemp(allText)) {
          const targetTemp = getProteinTemperature(allText);
          grillRemoveTemp = extractRemoveTemperature(allText, targetTemp);
        }

        const action: CookingAction = {
          id: uuidv4(),
          applianceId: ovenAppliance.category_id,
          methodId: String(suggestedOvenMethod),
          methodName: methodPattern.keywords[0].split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          parameters: {
            ...methodPattern.defaultParams,
            ...(extractedTemp && suggestedOvenMethod === OvenMethod.Bake ? { target_cavity_temp: extractedTemp } : {}),
            ...(hasTemperatureCheck ? { target_probe_temp: getProteinTemperature(allText) } : {}),
            ...(hasTemperatureCheck && grillRemoveTemp && grillRemoveTemp !== getProteinTemperature(allText)
                ? { remove_probe_temp: grillRemoveTemp } : {}),
            cooking_time: cookTime * 60 || methodPattern.estimatedTime! * 60,
          },
          ...(grillStepIndex >= 0 ? { stepIndex: grillStepIndex } : {}),
        };

        return {
          suggestedAppliance: ovenAppliance.category_id,
          suggestedActions: [action],
          useProbe: hasTemperatureCheck,
          probeTemp: hasTemperatureCheck ? getProteinTemperature(allText) : undefined,
          confidence: 0.8,
          reasoning
        };
      }
    }
  }

  // Find matching cooking methods for non-grilling recipes
  const methodMatches = COOKING_METHOD_PATTERNS.filter(pattern => {
    return pattern.keywords.some(keyword => allTextLower.includes(keyword));
  });


  if (methodMatches.length === 0) {
    return {
      suggestedActions: [],
      confidence: 0,
      reasoning: ['No specific cooking methods detected that match ChefIQ capabilities.']
    };
  }

  // Score each method by keyword frequency
  const scoredMethods = methodMatches.map(method => {
    let matchCount = method.keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = allTextLower.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);

    // Boost baking score if temperature increase is mentioned
    if (method.methodId === OvenMethod.Bake &&
        (allTextLower.includes('increase temperature') || allTextLower.includes('increase oven temperature'))) {
      matchCount += 5; // Strong indicator for baking
      reasoning.push('Detected temperature increase instructions - prioritizing bake method.');
    }

    // Reduce dehydrate score if high temperatures are mentioned
    if (method.methodId === OvenMethod.Dehydrate && extractedTemp && extractedTemp > 200) {
      matchCount = Math.max(0, matchCount - 3); // Dehydrating typically uses low temps
    }

    return { method, score: matchCount };
  }).sort((a, b) => b.score - a.score);

  const bestMethod = scoredMethods[0];
  const suggestedAppliance = CHEFIQ_APPLIANCES.find(
    appliance => appliance.thing_category_name === bestMethod.method.applianceType
  );

  if (!suggestedAppliance) {
    return {
      suggestedActions: [],
      confidence: 0,
      reasoning: ['Could not map detected cooking method to available appliances.']
    };
  }

  reasoning.push(`Detected "${bestMethod.method.keywords[0]}" cooking method from recipe text.`);

  // Check for probe usage (oven only)
  let useProbe = false;
  let probeTemp = 160; // default
  let removeProbeTemp: number | null = null;

  if (bestMethod.method.applianceType === 'oven') {
    const hasProbeKeywords = PROBE_KEYWORDS.some(keyword => allTextLower.includes(keyword));

    if (hasProbeKeywords) {
      useProbe = true;
      reasoning.push('Detected temperature-based cooking instructions, suggesting probe use.');

      // Get protein temperature using temperature guide
      probeTemp = getProteinTemperature(allText);

      const detectedProtein = detectProteinType(allText);
      if (detectedProtein) {
        reasoning.push(`Detected ${detectedProtein} protein, suggesting ${probeTemp}°F target temperature.`);
      }

      // Check if recipe needs remove temperature (carryover cooking)
      if (shouldUseRemoveTemp(allText)) {
        removeProbeTemp = extractRemoveTemperature(allText, probeTemp);

        if (removeProbeTemp && removeProbeTemp !== probeTemp) {
          reasoning.push(
            `Recipe involves large protein or resting - suggesting remove temp at ${removeProbeTemp}°F ` +
            `(${probeTemp - removeProbeTemp}°F carryover cooking).`
          );
        }
      }
    }
  }

  // Create primary cooking action with extracted parameters
  const primaryParams = { ...bestMethod.method.defaultParams };

  // Override temperature for oven methods if we extracted one
  if (bestMethod.method.applianceType === 'oven' && extractedTemp) {
    if (bestMethod.method.methodId === OvenMethod.Bake ||
        bestMethod.method.methodId === OvenMethod.Roast ||
        bestMethod.method.methodId === OvenMethod.AirFry) {
      primaryParams.target_cavity_temp = extractedTemp;
      reasoning.push(`Using extracted initial temperature of ${extractedTemp}°F for ${bestMethod.method.keywords[0]}.`);
    }
  }

  // Extract specialized parameters for air frying
  if (bestMethod.method.applianceType === 'oven' &&
      bestMethod.method.methodId === OvenMethod.AirFry) {
    const airFryParams = extractAirFryingParams(stepTexts);

    if (airFryParams.temperature) {
      primaryParams.target_cavity_temp = airFryParams.temperature;
      reasoning.push(`Using extracted air fryer temperature: ${airFryParams.temperature}°F`);
    }

    if (airFryParams.fanSpeed !== undefined) {
      primaryParams.fan_speed = airFryParams.fanSpeed;
      reasoning.push(`Using air fryer fan speed: High`);
    }

    // Override cooking time with air fry-specific time if found
    if (airFryParams.cookingTime) {
      primaryParams.cooking_time = airFryParams.cookingTime * 60; // Convert to seconds
      reasoning.push(`Using extracted air frying time: ${airFryParams.cookingTime} minutes`);
    }
  }

  // Extract specialized parameters for roasting
  if (bestMethod.method.applianceType === 'oven' &&
      bestMethod.method.methodId === OvenMethod.Roast) {
    const roastParams = extractRoastingParams(stepTexts);

    if (roastParams.temperature) {
      primaryParams.target_cavity_temp = roastParams.temperature;
      reasoning.push(`Using extracted roasting temperature: ${roastParams.temperature}°F`);
    }

    if (roastParams.fanSpeed !== undefined) {
      primaryParams.fan_speed = roastParams.fanSpeed;
      reasoning.push(`Using roasting fan speed: Medium`);
    }

    // Override cooking time with roast-specific time if found
    if (roastParams.cookingTime) {
      primaryParams.cooking_time = roastParams.cookingTime * 60; // Convert to seconds
      reasoning.push(`Using extracted roasting time: ${roastParams.cookingTime} minutes`);
    }
  }

  // Extract specialized parameters for broiling
  if (bestMethod.method.applianceType === 'oven' &&
      bestMethod.method.methodId === OvenMethod.Broil) {
    const broilParams = extractBroilingParams(stepTexts);

    if (broilParams.tempLevel !== undefined) {
      primaryParams.temp_level = broilParams.tempLevel;
      const tempLevelName = broilParams.tempLevel === TemperatureLevel.Low ? 'Low' : 'High';
      reasoning.push(`Using broiling temperature level: ${tempLevelName}`);
    }

    // Override cooking time with broil-specific time if found
    if (broilParams.cookingTime) {
      primaryParams.cooking_time = broilParams.cookingTime * 60; // Convert to seconds
      reasoning.push(`Using extracted broiling time: ${broilParams.cookingTime} minutes`);
    }
  }

  // Extract specialized parameters for steaming
  if (bestMethod.method.applianceType === 'cooker' &&
      bestMethod.method.methodId === CookerMethod.Steam) {
    const steamParams = extractSteamingParams(stepTexts);

    // Override cooking time with steam-specific time if found
    if (steamParams.cookingTime) {
      primaryParams.cooking_time = steamParams.cookingTime * 60; // Convert to seconds
      reasoning.push(`Using extracted steaming time: ${steamParams.cookingTime} minutes`);
    }
  }

  // Extract specialized parameters for searing/sautéing
  if (bestMethod.method.applianceType === 'cooker' &&
      bestMethod.method.methodId === CookerMethod.SearSaute) {
    const searParams = extractSearingSauteParams(stepTexts);

    if (searParams.tempLevel !== undefined) {
      primaryParams.temp_level = searParams.tempLevel;
      const tempLevelName = searParams.tempLevel === TemperatureLevel.MediumLow ? 'Medium-Low' :
                           searParams.tempLevel === TemperatureLevel.MediumHigh ? 'Medium-High' : 'High';
      reasoning.push(`Using searing/sautéing temperature level: ${tempLevelName}`);
    }

    // Override cooking time with sear/sauté-specific time if found
    if (searParams.cookingTime) {
      primaryParams.cooking_time = searParams.cookingTime * 60; // Convert to seconds
      reasoning.push(`Using extracted searing/sautéing time: ${searParams.cookingTime} minutes`);
    }
  }

  // Extract specialized parameters for sous vide
  if (bestMethod.method.applianceType === 'cooker' &&
      bestMethod.method.methodId === CookerMethod.SousVide) {
    const sousVideParams = extractSousVideParams(stepTexts);

    if (sousVideParams.temperature) {
      primaryParams.cooking_temp = sousVideParams.temperature;
      reasoning.push(`Using extracted sous vide temperature: ${sousVideParams.temperature}°F`);
    }

    // Override cooking time with sous vide-specific time if found
    if (sousVideParams.cookingTime) {
      primaryParams.cooking_time = sousVideParams.cookingTime * 60; // Convert to seconds
      reasoning.push(`Using extracted sous vide time: ${sousVideParams.cookingTime} minutes`);
    }
  }

  // Extract specialized parameters for toasting
  if (bestMethod.method.applianceType === 'oven' &&
      bestMethod.method.methodId === OvenMethod.Toast) {
    const toastParams = extractToastingParams(stepTexts);

    if (toastParams.shadeLevel !== undefined) {
      primaryParams.shade_level = toastParams.shadeLevel;
      const shadeName = Object.values(ShadeLevel)[toastParams.shadeLevel];
      reasoning.push(`Using toasting shade level: ${shadeName}`);
    }

    if (toastParams.isFrozen) {
      primaryParams.is_frozen = toastParams.isFrozen;
      reasoning.push(`Detected frozen bread setting`);
    }

    if (toastParams.isBagel) {
      primaryParams.is_bagel = toastParams.isBagel;
      reasoning.push(`Detected bagel mode setting`);
    }

    // Override cooking time with toast-specific time if found
    if (toastParams.cookingTime) {
      primaryParams.cooking_time = toastParams.cookingTime * 60; // Convert to seconds
      reasoning.push(`Using extracted toasting time: ${toastParams.cookingTime} minutes`);
    }
  }

  // Extract specialized parameters for dehydrating
  if (bestMethod.method.applianceType === 'oven' &&
      bestMethod.method.methodId === OvenMethod.Dehydrate) {
    const dehydrateParams = extractDehydratingParams(stepTexts);

    if (dehydrateParams.temperature) {
      primaryParams.target_cavity_temp = dehydrateParams.temperature;
      reasoning.push(`Using extracted dehydrating temperature: ${dehydrateParams.temperature}°F`);
    }

    if (dehydrateParams.fanSpeed !== undefined) {
      primaryParams.fan_speed = dehydrateParams.fanSpeed;
      reasoning.push(`Using dehydrating fan speed: Low`);
    }

    // Override cooking time with dehydrate-specific time if found
    if (dehydrateParams.cookingTime) {
      primaryParams.cooking_time = dehydrateParams.cookingTime * 60; // Convert to seconds
      reasoning.push(`Using extracted dehydrating time: ${dehydrateParams.cookingTime} minutes`);
    }
  }

  // Extract specialized parameters for pressure cooking
  if (bestMethod.method.applianceType === 'cooker' &&
      bestMethod.method.methodId === CookerMethod.Pressure) {
    const pressureParams = extractPressureCookingParams(stepTexts);

    if (pressureParams.pressureLevel !== undefined) {
      primaryParams.pres_level = pressureParams.pressureLevel;
      reasoning.push(`Detected pressure level: ${pressureParams.pressureLevel === PressureLevel.High ? 'High' : 'Low'} pressure`);
    }

    if (pressureParams.pressureRelease !== undefined) {
      primaryParams.pres_release = pressureParams.pressureRelease;
      const releaseMethod = pressureParams.pressureRelease === PressureRelease.Natural ? 'Natural' :
                           pressureParams.pressureRelease === PressureRelease.Pulse ? 'Pulse' : 'Quick';
      reasoning.push(`Detected pressure release method: ${releaseMethod} release`);
    }

    // Override cooking time with pressure-specific time if found
    if (pressureParams.cookingTime) {
      primaryParams.cooking_time = pressureParams.cookingTime * 60; // Convert to seconds
      reasoning.push(`Using extracted pressure cooking time: ${pressureParams.cookingTime} minutes`);
    }
  }

  // Extract specialized parameters for slow cooking
  if (bestMethod.method.applianceType === 'cooker' &&
      bestMethod.method.methodId === CookerMethod.SlowCook) {
    const slowCookParams = extractSlowCookingParams(stepTexts);

    if (slowCookParams.tempLevel !== undefined) {
      primaryParams.temp_level = slowCookParams.tempLevel;
      const tempLevelName = slowCookParams.tempLevel === TemperatureLevel.Low ? 'Low' : 'High';
      reasoning.push(`Detected slow cooking temperature level: ${tempLevelName}`);
    }

    // Override cooking time with slow cook-specific time if found
    if (slowCookParams.cookingTime) {
      primaryParams.cooking_time = slowCookParams.cookingTime * 60; // Convert to seconds
      reasoning.push(`Using extracted slow cooking time: ${slowCookParams.cookingTime} minutes`);
    }
  }

  // Find which instruction step(s) contain the best method
  const primaryMethodStep = instructionAnalysis.find(analysis =>
    analysis.matches.some(m => m.methodId === bestMethod.method.methodId)
  );

  const primaryAction: CookingAction = {
    id: uuidv4(),
    applianceId: suggestedAppliance.category_id,
    methodId: String(bestMethod.method.methodId),
    methodName: bestMethod.method.keywords[0].split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    parameters: {
      ...primaryParams,
      ...(useProbe ? { target_probe_temp: probeTemp } : {}),
      // Only add remove_probe_temp if it's different from target
      ...(useProbe && removeProbeTemp && removeProbeTemp !== probeTemp ? { remove_probe_temp: removeProbeTemp } : {}),
      // Use extracted cooking time from instructions, fall back to passed cookTime, then default
      cooking_time: (extractedCookingTime ? extractedCookingTime * 60 : null) ||
                   (cookTime * 60) ||
                   primaryParams.cooking_time,
    },
    ...(primaryMethodStep ? { stepIndex: primaryMethodStep.index } : {}),
  };

  suggestedActions.push(primaryAction);
  reasoning.push(`Suggested ${suggestedAppliance.name} with ${primaryAction.methodName} method.`);

  // Check if there's a temperature increase step for baking
  if (bestMethod.method.applianceType === 'oven' &&
      bestMethod.method.methodId === OvenMethod.Bake &&
      temperatureSteps.length > 1) {

    const increaseStep = temperatureSteps.find(t => t.isIncrease);
    if (increaseStep && increaseStep.temp > (extractedTemp || 0)) {
      // Create a second baking action for the increased temperature
      const totalCookingTime = (extractedCookingTime ? extractedCookingTime * 60 : null) ||
                              (cookTime * 60) ||
                              primaryParams.cooking_time;

      const secondBakeAction: CookingAction = {
        id: uuidv4(),
        applianceId: suggestedAppliance.category_id,
        methodId: String(bestMethod.method.methodId),
        methodName: 'Bake (Increased Temp)',
        parameters: {
          ...primaryParams,
          target_cavity_temp: increaseStep.temp,
          cooking_time: Math.floor(totalCookingTime / 3), // Assume 1/3 of time at higher temp
        },
        stepIndex: increaseStep.step
      };

      suggestedActions.push(secondBakeAction);
      reasoning.push(`Added second baking step at ${increaseStep.temp}°F for temperature increase.`);
    }
  }

  // Look for additional cooking methods in the recipe (e.g., sauté then pressure cook)
  const additionalMethods = scoredMethods.slice(1, 3).filter(method =>
    method.score > 1 && // Must have decent confidence
    method.method.applianceType === bestMethod.method.applianceType && // Same appliance
    method.method.methodId !== bestMethod.method.methodId // Different method
  );

  additionalMethods.forEach((method, index) => {
    // Find which instruction step contains this additional method
    const additionalMethodStep = instructionAnalysis.find(analysis =>
      analysis.matches.some(m => m.methodId === method.method.methodId)
    );

    const additionalAction: CookingAction = {
      id: uuidv4(),
      applianceId: suggestedAppliance.category_id,
      methodId: String(method.method.methodId),
      methodName: method.method.keywords[0].split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      parameters: {
        ...method.method.defaultParams,
        // Shorter time for secondary methods
        cooking_time: Math.min(
          method.method.defaultParams.cooking_time || 600,
          (cookTime * 60) / 3
        ),
      },
      ...(additionalMethodStep ? { stepIndex: additionalMethodStep.index } : {}),
    };

    suggestedActions.push(additionalAction);
    reasoning.push(`Also detected ${additionalAction.methodName} method in recipe steps.`);
  });

  // Calculate confidence based on keyword matches and recipe coherence
  const confidence = Math.min(1, (bestMethod.score * 0.3) + 0.4);

  return {
    suggestedAppliance: suggestedAppliance.category_id,
    suggestedActions,
    useProbe,
    probeTemp,
    confidence,
    reasoning
  };
  } catch (error) {
    console.error('Error in recipe analysis:', error);
    return {
      suggestedActions: [],
      confidence: 0,
      reasoning: ['Error occurred during recipe analysis']
    };
  }
};

// Helper function to extract cooking time from text
export const extractCookingTime = (text: string): number => {
  const timeRegex = /(\d+)\s*(hour|hr|minute|min)s?/gi;
  const matches = text.match(timeRegex);

  if (!matches) return 30; // default 30 minutes

  let totalMinutes = 0;
  matches.forEach(match => {
    const value = parseInt(match.match(/\d+/)?.[0] || '0');
    if (match.toLowerCase().includes('hour') || match.toLowerCase().includes('hr')) {
      totalMinutes += value * 60;
    } else {
      totalMinutes += value;
    }
  });

  return totalMinutes || 30;
};

// Helper function to extract baking/cooking times from recipe instructions
export const extractCookingTimeFromInstructions = (instructions: string[]): number | null => {
  // Look for baking/cooking time patterns in instructions
  const timePatterns = [
    /bake.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /cook.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /oven.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /roast.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?.*?(?:in\s+(?:the\s+)?oven|baking|cooking)/gi,
    /(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?(?:\s*[,.]?\s*or\s+until)/gi,
    /(?:for\s+an?\s+additional\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let totalTime = 0;
  let foundTime = false;
  const foundTimes: number[] = [];

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    // Skip pure prep steps, but allow steps that might have cooking time
    if (stepLower.startsWith('preheat') ||
        stepLower.includes('prepare') ||
        stepLower.includes('mix') ||
        stepLower.includes('combine')) {
      continue;
    }

    for (const pattern of timePatterns) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(step.toLowerCase())) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        // Convert to minutes
        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        // If there's a range (e.g., "20-25 minutes"), use the higher value for safety
        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        // Accumulate cooking times (e.g., "2 hours" + "additional 30 minutes")
        if (minutes > 0 && minutes <= 480) { // Max 8 hours
          if (stepLower.includes('additional')) {
            // This is additional time, add to total
            totalTime += minutes;
          } else {
            // This is a main cooking time
            foundTimes.push(minutes);
          }
          foundTime = true;
        }
      }
    }
  }

  if (foundTime) {
    // If we have main cooking times, use the longest one and add any additional time
    const mainTime = foundTimes.length > 0 ? Math.max(...foundTimes) : 0;
    const result = mainTime + totalTime;
    return result;
  }

  return null;
};

// Helper function to extract temperature from text
export const extractTemperature = (text: string, preferInitial: boolean = true): number | null => {
  // Look for temperature patterns like "350°F", "350 degrees F", "350 degrees", etc.
  // Also handle Celsius temperatures and convert them to Fahrenheit
  const fahrenheitPatterns = [
    /(\d{2,3})\s*°\s*F/gi,
    /(\d{2,3})\s*degrees\s*F(?:ahrenheit)?/gi,
  ];

  const celsiusPatterns = [
    /(\d{2,3})\s*°\s*C/gi,
    /(\d{2,3})\s*degrees\s*C(?:elsius)?/gi,
  ];

  const ambiguousPatterns = [
    /(\d{2,3})\s*degrees/gi,  // No unit specified
    /preheat\s+(?:oven\s+)?(?:to\s+)?(\d{2,3})/gi,
    /temperature\s+(?:to\s+)?(\d{2,3})/gi,
    /heat\s+(?:to\s+)?(\d{2,3})/gi,
    /oven\s+(?:to\s+)?(\d{2,3})/gi,
    /bake\s+(?:at\s+)?(\d{2,3})/gi,
  ];

  let temperatures: number[] = [];

  // Check for Celsius temperatures first
  for (const pattern of celsiusPatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(text)) !== null) {
      const tempC = parseInt(match[1]);
      // Valid oven temperature range in Celsius (65-290°C)
      if (tempC >= 65 && tempC <= 290) {
        // Convert to Fahrenheit: F = (C × 9/5) + 32
        const tempF = Math.round((tempC * 9 / 5) + 32);
        temperatures.push(tempF);
      }
    }
  }

  // Check for explicit Fahrenheit temperatures
  for (const pattern of fahrenheitPatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(text)) !== null) {
      const temp = parseInt(match[1]);
      // Valid oven temperature range in Fahrenheit
      if (temp >= 150 && temp <= 550) {
        temperatures.push(temp);
      }
    }
  }

  // Check ambiguous patterns (assume Fahrenheit if in valid F range, otherwise try Celsius)
  for (const pattern of ambiguousPatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(text)) !== null) {
      const temp = parseInt(match[1]);

      // If it's in valid Fahrenheit range (150-550°F), assume Fahrenheit
      if (temp >= 150 && temp <= 550) {
        temperatures.push(temp);
      }
      // If it's in Celsius range (65-290°C) but not Fahrenheit, convert it
      else if (temp >= 65 && temp <= 290) {
        const tempF = Math.round((temp * 9 / 5) + 32);
        temperatures.push(tempF);
      }
    }
  }

  // If multiple temperatures found, prioritize based on context
  if (temperatures.length > 0) {
    const textLower = text.toLowerCase();

    // For initial cooking (preheat), use the first temperature found
    if (preferInitial && textLower.includes('preheat')) {
      // Find the temperature associated with preheat
      const preheatMatch = textLower.match(/preheat[^0-9]*(\d{2,3})/);
      if (preheatMatch) {
        const preheatTemp = parseInt(preheatMatch[1]);
        if (preheatTemp >= 150 && preheatTemp <= 550) {
          return preheatTemp;
        }
      }
    }

    // For "increase temperature" patterns, use the higher temp
    if (textLower.includes('increase') && textLower.includes('temperature')) {
      return Math.max(...temperatures);
    }

    // Otherwise return the first found temperature (usually the main cooking temp)
    return temperatures[0];
  }

  return null;
};

// Helper function to extract multiple temperatures with their contexts
export const extractTemperaturesWithContext = (instructions: string[]): { step: number; temp: number; isIncrease: boolean }[] => {
  const temperatures: { step: number; temp: number; isIncrease: boolean }[] = [];

  instructions.forEach((instruction, index) => {
    const temp = extractTemperature(instruction, false);
    if (temp) {
      const isIncrease = instruction.toLowerCase().includes('increase');
      temperatures.push({
        step: index,
        temp,
        isIncrease
      });
    }
  });

  return temperatures;
};

// Helper function to extract pressure cooking parameters
export const extractPressureCookingParams = (instructions: string[]) => {
  const allText = instructions.join(' ').toLowerCase();

  // Extract pressure level
  let pressureLevel = PressureLevel.High; // Default
  if (allText.includes('low pressure') || allText.includes('gentle pressure')) {
    pressureLevel = PressureLevel.Low;
  }

  // Extract pressure release method
  let pressureRelease = PressureRelease.Quick; // Default
  if (allText.includes('natural release') || allText.includes('naturally release') ||
      allText.includes('let pressure release naturally')) {
    pressureRelease = PressureRelease.Natural;
  } else if (allText.includes('pulse release') || allText.includes('intermittent release')) {
    pressureRelease = PressureRelease.Pulse;
  }

  // Extract pressure cooking time
  const pressureTimePatterns = [
    /pressure\s+cook.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /cook\s+(?:under\s+)?pressure.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /(?:in\s+)?(?:the\s+)?(?:instant\s+pot|pressure\s+cooker).*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let cookingTime: number | null = null;

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of pressureTimePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        if (minutes > 0 && minutes <= 240) {
          // Max 4 hours for pressure cooking
          cookingTime = minutes;
          break;
        }
      }
      if (cookingTime) break;
    }
    if (cookingTime) break;
  }

  return {
    pressureLevel,
    pressureRelease,
    cookingTime
  };
};

// Helper function to extract slow cooking parameters
export const extractSlowCookingParams = (instructions: string[]) => {
  const allText = instructions.join(' ').toLowerCase();

  // Extract temperature level for slow cooking
  let tempLevel = TemperatureLevel.High; // Default
  if (allText.includes('low heat') || allText.includes('on low') ||
      allText.includes('low temperature') || allText.includes('low setting')) {
    tempLevel = TemperatureLevel.Low;
  }

  // Extract slow cooking time - typically longer than regular cooking
  const slowCookTimePatterns = [
    /slow\s+cook.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /cook\s+(?:on\s+)?(?:low|high).*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /(?:in\s+)?(?:the\s+)?(?:slow\s+cooker|crock\s+pot).*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /simmer.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let cookingTime: number | null = null;

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of slowCookTimePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(step.toLowerCase())) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        // Slow cooking typically takes 2+ hours, accept longer times
        if (minutes >= 30 && minutes <= 1440) { // 30 minutes to 24 hours
          cookingTime = minutes;
          break;
        }
      }
      if (cookingTime) break;
    }
    if (cookingTime) break;
  }

  return {
    tempLevel,
    cookingTime
  };
};

// Helper function to extract air frying parameters
export const extractAirFryingParams = (instructions: string[]) => {
  const allText = instructions.join(' ').toLowerCase();

  // Extract air fryer temperature (higher than normal baking)
  let temperature: number | null = null;
  const airFryTempPatterns = [
    /air\s+fry.*?(?:at\s+)?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
    /(?:in\s+)?(?:the\s+)?air\s+fryer.*?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
    /crispy.*?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
  ];

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of airFryTempPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(step.toLowerCase())) !== null) {
        const temp = parseInt(match[1]);
        if (temp >= 300 && temp <= 450) { // Typical air fryer range
          temperature = temp;
          break;
        }
      }
      if (temperature) break;
    }
    if (temperature) break;
  }

  // Extract air frying time (typically shorter than baking)
  const airFryTimePatterns = [
    /air\s+fry.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /(?:in\s+)?(?:the\s+)?air\s+fryer.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /crispy.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let cookingTime: number | null = null;

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of airFryTimePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(step.toLowerCase())) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        // Air frying typically 5-60 minutes
        if (minutes >= 3 && minutes <= 120) {
          cookingTime = minutes;
          break;
        }
      }
      if (cookingTime) break;
    }
    if (cookingTime) break;
  }

  // Fan speed is always high for air frying
  const fanSpeed = FanSpeed.High;

  return {
    temperature,
    cookingTime,
    fanSpeed
  };
};

// Helper function to extract roasting parameters
export const extractRoastingParams = (instructions: string[]) => {
  const allText = instructions.join(' ').toLowerCase();

  // Extract roasting temperature (typically higher than baking)
  let temperature: number | null = null;
  const roastTempPatterns = [
    /roast.*?(?:at\s+)?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
    /roasting.*?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
    /oven.*?roast.*?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
  ];

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of roastTempPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const temp = parseInt(match[1]);
        if (temp >= 325 && temp <= 500) { // Typical roasting range
          temperature = temp;
          break;
        }
      }
      if (temperature) break;
    }
    if (temperature) break;
  }

  // Extract roasting time (typically longer than air frying, similar to baking)
  const roastTimePatterns = [
    /roast.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /roasting.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /(?:in\s+)?(?:the\s+)?oven.*?roast.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let cookingTime: number | null = null;

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of roastTimePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        // Roasting typically 20 minutes to 4 hours
        if (minutes >= 15 && minutes <= 240) {
          cookingTime = minutes;
          break;
        }
      }
      if (cookingTime) break;
    }
    if (cookingTime) break;
  }

  // Medium fan speed for roasting (allows for browning but not too intense)
  const fanSpeed = FanSpeed.Medium;

  return {
    temperature,
    cookingTime,
    fanSpeed
  };
};

// Helper function to extract broiling parameters
export const extractBroilingParams = (instructions: string[]) => {
  const allText = instructions.join(' ').toLowerCase();

  // Extract broiling temperature level (high/low)
  let tempLevel = TemperatureLevel.High; // Default for broiling
  if (allText.includes('low broil') || allText.includes('broil on low') ||
      allText.includes('low heat broil')) {
    tempLevel = TemperatureLevel.Low;
  }

  // Extract broiling time (typically very short)
  const broilTimePatterns = [
    /broil.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /broiling.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /(?:under\s+)?(?:the\s+)?broiler.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let cookingTime: number | null = null;

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of broilTimePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        // Broiling typically 2-20 minutes
        if (minutes >= 1 && minutes <= 30) {
          cookingTime = minutes;
          break;
        }
      }
      if (cookingTime) break;
    }
    if (cookingTime) break;
  }

  return {
    tempLevel,
    cookingTime
  };
};

// Helper function to extract steaming parameters
export const extractSteamingParams = (instructions: string[]) => {
  const allText = instructions.join(' ').toLowerCase();

  // Extract steaming time (typically moderate cooking times)
  const steamTimePatterns = [
    /steam.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /steaming.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /(?:in\s+)?(?:the\s+)?steamer.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /steam\s+basket.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let cookingTime: number | null = null;

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of steamTimePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        // Steaming typically 3-60 minutes
        if (minutes >= 2 && minutes <= 90) {
          cookingTime = minutes;
          break;
        }
      }
      if (cookingTime) break;
    }
    if (cookingTime) break;
  }

  return {
    cookingTime
  };
};

// Helper function to extract searing/sautéing parameters
export const extractSearingSauteParams = (instructions: string[]) => {
  const allText = instructions.join(' ').toLowerCase();

  // Extract temperature level for searing/sautéing
  let tempLevel = TemperatureLevel.MediumHigh; // Default for searing
  if (allText.includes('low heat') || allText.includes('gentle') ||
      allText.includes('low temperature')) {
    tempLevel = TemperatureLevel.MediumLow;
  } else if (allText.includes('high heat') || allText.includes('hot')) {
    tempLevel = TemperatureLevel.High;
  }

  // Extract searing/sautéing time (typically short)
  const searTimePatterns = [
    /sear.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /saut[ée].*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /brown.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /fry.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let cookingTime: number | null = null;

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of searTimePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        // Searing/sautéing typically 1-30 minutes
        if (minutes >= 1 && minutes <= 45) {
          cookingTime = minutes;
          break;
        }
      }
      if (cookingTime) break;
    }
    if (cookingTime) break;
  }

  return {
    tempLevel,
    cookingTime
  };
};

// Helper function to extract sous vide parameters
export const extractSousVideParams = (instructions: string[]) => {
  const allText = instructions.join(' ').toLowerCase();

  // Extract sous vide temperature (very precise, typically 110-200°F)
  let temperature: number | null = null;
  const sousVideTempPatterns = [
    /sous\s+vide.*?(?:at\s+)?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
    /water\s+bath.*?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
    /vacuum.*?(?:at\s+)?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
    /immersion.*?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
  ];

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of sousVideTempPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const temp = parseInt(match[1]);
        if (temp >= 110 && temp <= 200) { // Typical sous vide range
          temperature = temp;
          break;
        }
      }
      if (temperature) break;
    }
    if (temperature) break;
  }

  // Extract sous vide cooking time (typically very long - hours)
  const sousVideTimePatterns = [
    /sous\s+vide.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /water\s+bath.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /vacuum.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /immersion.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let cookingTime: number | null = null;

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of sousVideTimePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        // Sous vide typically 30 minutes to 72 hours
        if (minutes >= 30 && minutes <= 4320) { // 30 min to 72 hours
          cookingTime = minutes;
          break;
        }
      }
      if (cookingTime) break;
    }
    if (cookingTime) break;
  }

  return {
    temperature,
    cookingTime
  };
};

// Helper function to extract toasting parameters
export const extractToastingParams = (instructions: string[]) => {
  const allText = instructions.join(' ').toLowerCase();

  // Extract shade level for toasting
  let shadeLevel = ShadeLevel.Medium; // Default
  if (allText.includes('light') || allText.includes('lightly toasted') ||
      allText.includes('pale golden')) {
    shadeLevel = ShadeLevel.Light;
  } else if (allText.includes('medium light') || allText.includes('golden')) {
    shadeLevel = ShadeLevel.MediumLight;
  } else if (allText.includes('medium dark') || allText.includes('deep golden')) {
    shadeLevel = ShadeLevel.MediumDark;
  } else if (allText.includes('dark') || allText.includes('well toasted') ||
             allText.includes('deep brown')) {
    shadeLevel = ShadeLevel.Dark;
  }

  // Extract toasting time (typically very short)
  const toastTimePatterns = [
    /toast.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /toasting.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /golden\s+brown.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let cookingTime: number | null = null;

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of toastTimePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        // Toasting typically 1-10 minutes
        if (minutes >= 1 && minutes <= 15) {
          cookingTime = minutes;
          break;
        }
      }
      if (cookingTime) break;
    }
    if (cookingTime) break;
  }

  // Check for frozen bread
  let isFrozen = false;
  if (allText.includes('frozen') || allText.includes('from frozen')) {
    isFrozen = true;
  }

  // Check for bagel mode
  let isBagel = false;
  if (allText.includes('bagel') || allText.includes('english muffin') ||
      allText.includes('cut side')) {
    isBagel = true;
  }

  return {
    shadeLevel,
    cookingTime,
    isFrozen,
    isBagel
  };
};

// Helper function to extract dehydrating parameters
export const extractDehydratingParams = (instructions: string[]) => {
  const allText = instructions.join(' ').toLowerCase();

  // Extract dehydrating temperature (very low, typically 95-165°F)
  let temperature: number | null = null;
  const dehydrateTempPatterns = [
    /dehydrat.*?(?:at\s+)?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
    /dehydrator.*?(?:at\s+)?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
    /(?:make|making)\s+jerky.*?(?:at\s+)?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
    /(?:at\s+)?(\d{2,3})\s*degrees.*?(?:for\s+)?jerky/gi,
    /drying\s+fruit.*?(?:at\s+)?(\d{2,3})\s*(?:°\s*f|degrees\s*f?)/gi,
  ];

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of dehydrateTempPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const temp = parseInt(match[1]);
        if (temp >= 95 && temp <= 165) { // Typical dehydrating range
          temperature = temp;
          break;
        }
      }
      if (temperature) break;
    }
    if (temperature) break;
  }

  // Extract dehydrating time (typically very long - many hours)
  const dehydrateTimePatterns = [
    /dehydrat.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /dehydrator.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /(?:make|making)\s+jerky.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /drying\s+fruit.*?(?:for\s+)?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
    /until\s+completely\s+dried.*?(\d+)\s*(?:[-–to]\s*(\d+)\s*)?(hour|hr|minute|min)s?/gi,
  ];

  let cookingTime: number | null = null;

  for (const step of instructions) {
    const stepLower = step.toLowerCase();

    for (const pattern of dehydrateTimePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(stepLower)) !== null) {
        const time1 = parseInt(match[1]);
        const time2 = match[2] ? parseInt(match[2]) : null;
        const unit = match[3].toLowerCase();

        let minutes = time1;
        if (unit.includes('hour') || unit.includes('hr')) {
          minutes = time1 * 60;
        }

        if (time2) {
          let minutes2 = time2;
          if (unit.includes('hour') || unit.includes('hr')) {
            minutes2 = time2 * 60;
          }
          minutes = Math.max(minutes, minutes2);
        }

        // Dehydrating typically 2-72 hours
        if (minutes >= 120 && minutes <= 4320) { // 2 hours to 72 hours
          cookingTime = minutes;
          break;
        }
      }
      if (cookingTime) break;
    }
    if (cookingTime) break;
  }

  // Low fan speed for dehydrating (gentle air circulation)
  const fanSpeed = FanSpeed.Low;

  return {
    temperature,
    cookingTime,
    fanSpeed
  };
};