import { CHEFIQ_APPLIANCES, CookingAction } from '../types/chefiq';

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
    methodId: 0,
    applianceType: 'cooker',
    keywords: ['pressure cook', 'instant pot', 'pressure cooker', 'quick cook', 'high pressure'],
    defaultParams: {
      cooking_method: 0,
      pres_level: 1, // High pressure
      pres_release: 0, // Quick release
      keep_warm: 1,
      delay_time: 0,
    },
    estimatedTime: 15
  },
  {
    methodId: 1,
    applianceType: 'cooker',
    keywords: ['sauté', 'saute', 'brown', 'sear', 'fry', 'cook until golden'],
    defaultParams: {
      cooking_method: 1,
      temp_level: 1, // Medium-Low
      keep_warm: 0,
      delay_time: 0,
    },
    estimatedTime: 10
  },
  {
    methodId: 2,
    applianceType: 'cooker',
    keywords: ['steam', 'steamer', 'steam basket', 'steamed'],
    defaultParams: {
      cooking_method: 2,
      keep_warm: 0,
      delay_time: 0,
    },
    estimatedTime: 15
  },
  {
    methodId: 3,
    applianceType: 'cooker',
    keywords: ['slow cook', 'slow cooker', 'crock pot', 'low and slow', 'simmer'],
    defaultParams: {
      cooking_method: 3,
      temp_level: 1, // High
      keep_warm: 1,
      delay_time: 0,
    },
    estimatedTime: 240
  },
  {
    methodId: 5,
    applianceType: 'cooker',
    keywords: ['sous vide', 'water bath', 'vacuum seal'],
    defaultParams: {
      cooking_method: 5,
      delay_time: 0,
    },
    estimatedTime: 120
  },

  // iQ MiniOven (CQ50) Methods
  {
    methodId: 'METHOD_BAKE',
    applianceType: 'oven',
    keywords: ['bake', 'baking', 'oven', 'baked', 'preheat'],
    defaultParams: {
      cooking_time: 1800, // 30 minutes
      target_cavity_temp: 350, // Will be overridden by extracted temp
      fan_speed: 0,
    },
    estimatedTime: 30
  },
  {
    methodId: 'METHOD_AIR_FRY',
    applianceType: 'oven',
    keywords: ['air fry', 'air fryer', 'crispy', 'crunchy', 'air-fry'],
    defaultParams: {
      cooking_time: 900, // 15 minutes
      target_cavity_temp: 375,
      fan_speed: 3,
    },
    estimatedTime: 15
  },
  {
    methodId: 'METHOD_ROAST',
    applianceType: 'oven',
    keywords: ['roast', 'roasted', 'roasting'],
    defaultParams: {
      cooking_time: 2700, // 45 minutes
      target_cavity_temp: 400,
      fan_speed: 1,
    },
    estimatedTime: 45
  },
  {
    methodId: 'METHOD_BROIL',
    applianceType: 'oven',
    keywords: ['broil', 'broiled', 'broiling', 'grill', 'grilled', 'char', 'outdoor grill', 'preheated grill', 'barbecue', 'bbq'],
    defaultParams: {
      cooking_time: 600, // 10 minutes
      temp_level: 1, // High
    },
    estimatedTime: 10
  },
  {
    methodId: 'METHOD_TOAST',
    applianceType: 'oven',
    keywords: ['toast', 'toasted', 'toasting', 'golden brown'],
    defaultParams: {
      cooking_time: 180, // 3 minutes
      shade_level: 2, // Medium
    },
    estimatedTime: 3
  },
  {
    methodId: 'METHOD_DEHYDRATE',
    applianceType: 'oven',
    keywords: ['dehydrate', 'dry', 'dried', 'dehydrating', 'jerky'],
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

// Temperature ranges for different proteins
const PROTEIN_TEMPERATURES: { [key: string]: number } = {
  'chicken': 165,
  'turkey': 165,
  'pork': 145,
  'beef': 135, // medium-rare
  'lamb': 145,
  'fish': 145,
  'salmon': 145,
};

export interface RecipeAnalysisResult {
  suggestedAppliance?: string; // category_id
  suggestedActions: CookingAction[];
  useProbe?: boolean;
  probeTemp?: number;
  confidence: number; // 0-1 score
  reasoning: string[];
}

// Helper function to get protein temperature
const getProteinTemperature = (text: string): number => {
  for (const [protein, temp] of Object.entries(PROTEIN_TEMPERATURES)) {
    if (text.includes(protein)) {
      return temp;
    }
  }
  return 145; // Default safe temperature
};

export const analyzeRecipeForChefIQ = (
  title: string,
  description: string,
  instructions: string[],
  cookTime: number
): RecipeAnalysisResult => {
  try {
    const allText = [title, description, ...instructions].join(' ');
    const allTextLower = allText.toLowerCase();
    const reasoning: string[] = [];
    const suggestedActions: CookingAction[] = [];

  // Extract temperatures from the recipe text
  const extractedTemp = extractTemperature(allText, true); // Prefer initial/preheat temperature
  const temperatureSteps = extractTemperaturesWithContext(instructions);

  // Extract cooking time from instructions
  const extractedCookingTime = extractCookingTimeFromInstructions(instructions);

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
  const instructionAnalysis = instructions.map((instruction, index) => {
    const instructionLower = instruction.toLowerCase();

    // Special handling: if "increase temperature" is mentioned, it's likely baking, not dehydrating
    let matches = COOKING_METHOD_PATTERNS.filter(pattern => {
      // Skip dehydrate method if we see "increase temperature" or temperature changes
      if (pattern.methodId === 'METHOD_DEHYDRATE' &&
          (instructionLower.includes('increase') || instructionLower.includes('raise')) &&
          instructionLower.includes('temperature')) {
        return false;
      }

      return pattern.keywords.some(keyword => instructionLower.includes(keyword));
    });

    // If we detect temperature increase/change, prioritize baking methods
    if ((instructionLower.includes('increase') || instructionLower.includes('raise')) &&
        instructionLower.includes('temperature')) {
      // Add baking method if not already present
      const bakingMethod = COOKING_METHOD_PATTERNS.find(p => p.methodId === 'METHOD_BAKE');
      if (bakingMethod && !matches.some(m => m.methodId === 'METHOD_BAKE')) {
        matches.push(bakingMethod);
      }
    }

    return { instruction, index, matches, text: instructionLower, originalText: instruction };
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
    let suggestedOvenMethod = 'METHOD_AIR_FRY'; // Default for crispy results

    if (allTextLower.includes('crispy') || allTextLower.includes('crunchy')) {
      suggestedOvenMethod = 'METHOD_AIR_FRY';
      reasoning.push('Detected need for crispy texture - suggesting Air Fry.');
    } else if (allTextLower.includes('char') || allTextLower.includes('sear') || allTextLower.includes('brown')) {
      suggestedOvenMethod = 'METHOD_BROIL';
      reasoning.push('Detected need for browning/searing - suggesting Broil.');
    } else if (cookTime > 20) {
      suggestedOvenMethod = 'METHOD_BAKE';
      reasoning.push('Longer cooking time detected - suggesting Bake.');
    }

    const ovenAppliance = CHEFIQ_APPLIANCES.find(a => a.thing_category_name === 'oven');
    if (ovenAppliance) {
      const methodPattern = COOKING_METHOD_PATTERNS.find(p => p.methodId === suggestedOvenMethod);
      if (methodPattern) {
        const action: CookingAction = {
          id: `auto_${Date.now()}`,
          applianceId: ovenAppliance.category_id,
          methodId: String(suggestedOvenMethod),
          methodName: methodPattern.keywords[0].split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          parameters: {
            ...methodPattern.defaultParams,
            ...(extractedTemp && suggestedOvenMethod === 'METHOD_BAKE' ? { target_cavity_temp: extractedTemp } : {}),
            ...(hasTemperatureCheck ? { target_probe_temp: getProteinTemperature(allTextLower) } : {}),
            cooking_time: cookTime * 60 || methodPattern.estimatedTime! * 60,
          },
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
    if (method.methodId === 'METHOD_BAKE' &&
        (allTextLower.includes('increase temperature') || allTextLower.includes('increase oven temperature'))) {
      matchCount += 5; // Strong indicator for baking
      reasoning.push('Detected temperature increase instructions - prioritizing bake method.');
    }

    // Reduce dehydrate score if high temperatures are mentioned
    if (method.methodId === 'METHOD_DEHYDRATE' && extractedTemp && extractedTemp > 200) {
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

  if (bestMethod.method.applianceType === 'oven') {
    const hasProbeKeywords = PROBE_KEYWORDS.some(keyword => allTextLower.includes(keyword));

    if (hasProbeKeywords) {
      useProbe = true;
      reasoning.push('Detected temperature-based cooking instructions, suggesting probe use.');

      // Try to find specific protein and temperature
      for (const [protein, temp] of Object.entries(PROTEIN_TEMPERATURES)) {
        if (allTextLower.includes(protein)) {
          probeTemp = temp;
          reasoning.push(`Found "${protein}" in recipe, suggesting ${temp}°F target temperature.`);
          break;
        }
      }
    }
  }

  // Create primary cooking action with extracted temperature
  const primaryParams = { ...bestMethod.method.defaultParams };

  // Override temperature for baking methods if we extracted one
  if (bestMethod.method.applianceType === 'oven' && extractedTemp) {
    if (bestMethod.method.methodId === 'METHOD_BAKE' ||
        bestMethod.method.methodId === 'METHOD_ROAST' ||
        bestMethod.method.methodId === 'METHOD_AIR_FRY') {
      primaryParams.target_cavity_temp = extractedTemp;
      reasoning.push(`Using extracted initial temperature of ${extractedTemp}°F for ${bestMethod.method.keywords[0]}.`);
    }
  }

  const primaryAction: CookingAction = {
    id: `auto_${Date.now()}`,
    applianceId: suggestedAppliance.category_id,
    methodId: String(bestMethod.method.methodId),
    methodName: bestMethod.method.keywords[0].split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    parameters: {
      ...primaryParams,
      ...(useProbe ? { target_probe_temp: probeTemp } : {}),
      // Use extracted cooking time from instructions, fall back to passed cookTime, then default
      cooking_time: (extractedCookingTime ? extractedCookingTime * 60 : null) ||
                   (cookTime * 60) ||
                   primaryParams.cooking_time,
    },
  };

  suggestedActions.push(primaryAction);
  reasoning.push(`Suggested ${suggestedAppliance.name} with ${primaryAction.methodName} method.`);

  // Check if there's a temperature increase step for baking
  if (bestMethod.method.applianceType === 'oven' &&
      bestMethod.method.methodId === 'METHOD_BAKE' &&
      temperatureSteps.length > 1) {

    const increaseStep = temperatureSteps.find(t => t.isIncrease);
    if (increaseStep && increaseStep.temp > (extractedTemp || 0)) {
      // Create a second baking action for the increased temperature
      const totalCookingTime = (extractedCookingTime ? extractedCookingTime * 60 : null) ||
                              (cookTime * 60) ||
                              primaryParams.cooking_time;

      const secondBakeAction: CookingAction = {
        id: `auto_${Date.now()}_temp_increase`,
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
    const additionalAction: CookingAction = {
      id: `auto_${Date.now()}_${index + 1}`,
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

  for (const instruction of instructions) {
    const instructionLower = instruction.toLowerCase();

    // Skip pure prep steps, but allow steps that might have cooking time
    if (instructionLower.startsWith('preheat') ||
        instructionLower.includes('prepare') ||
        instructionLower.includes('mix') ||
        instructionLower.includes('combine')) {
      continue;
    }

    for (const pattern of timePatterns) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(instructionLower)) !== null) {
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
          if (instructionLower.includes('additional')) {
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
  // Also handle "preheat oven to 350", "increase temperature to 350"
  const tempPatterns = [
    /(\d{2,3})\s*°\s*F/gi,
    /(\d{2,3})\s*degrees\s*(?:F|Fahrenheit)?/gi,
    /preheat\s+(?:oven\s+)?(?:to\s+)?(\d{2,3})/gi,
    /temperature\s+(?:to\s+)?(\d{2,3})/gi,
    /heat\s+(?:to\s+)?(\d{2,3})/gi,
    /oven\s+(?:to\s+)?(\d{2,3})/gi,
    /bake\s+(?:at\s+)?(\d{2,3})/gi,
  ];

  let temperatures: number[] = [];

  for (const pattern of tempPatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(text)) !== null) {
      const temp = parseInt(match[1]);
      // Valid oven temperature range
      if (temp >= 150 && temp <= 550) {
        temperatures.push(temp);
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