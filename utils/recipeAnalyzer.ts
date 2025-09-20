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
    keywords: ['bake', 'baking', 'oven', 'baked', '°f', 'degrees'],
    defaultParams: {
      cooking_time: 1800, // 30 minutes
      target_cavity_temp: 350,
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
    const allText = [title, description, ...instructions].join(' ').toLowerCase();
    const reasoning: string[] = [];
    const suggestedActions: CookingAction[] = [];

  // Analyze individual instructions for cooking methods
  const instructionAnalysis = instructions.map((instruction, index) => {
    const instructionLower = instruction.toLowerCase();
    const matches = COOKING_METHOD_PATTERNS.filter(pattern => {
      return pattern.keywords.some(keyword => instructionLower.includes(keyword));
    });
    return { instruction, index, matches, text: instructionLower };
  });

  // Detect primary protein cooking vs auxiliary steps
  const proteinKeywords = ['pork', 'chicken', 'beef', 'lamb', 'fish', 'salmon', 'turkey', 'steak', 'chops'];
  const grillKeywords = ['grill', 'grilled', 'outdoor grill', 'preheated grill', 'grate', 'barbecue', 'bbq'];
  const ovenKeywords = ['oven', 'bake', 'roast', 'broil', 'air fry'];

  // Check for grilling (should suggest oven as substitute)
  const hasGrilling = grillKeywords.some(keyword => allText.includes(keyword));
  const hasProtein = proteinKeywords.some(keyword => allText.includes(keyword));
  const hasTemperatureCheck = allText.includes('degrees') || allText.includes('thermometer') || allText.includes('internal temperature');

  if (hasGrilling && hasProtein) {
    reasoning.push('Detected grilling recipe with protein - suggesting oven as ChefIQ alternative.');

    // For grilled proteins, suggest oven methods (air fry, broil, or bake)
    let suggestedOvenMethod = 'METHOD_AIR_FRY'; // Default for crispy results

    if (allText.includes('crispy') || allText.includes('crunchy')) {
      suggestedOvenMethod = 'METHOD_AIR_FRY';
      reasoning.push('Detected need for crispy texture - suggesting Air Fry.');
    } else if (allText.includes('char') || allText.includes('sear') || allText.includes('brown')) {
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
          methodId: suggestedOvenMethod,
          methodName: methodPattern.keywords[0].split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          parameters: {
            ...methodPattern.defaultParams,
            ...(hasTemperatureCheck ? { target_probe_temp: getProteinTemperature(allText) } : {}),
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
    return pattern.keywords.some(keyword => allText.includes(keyword));
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
    const matchCount = method.keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = allText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);

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
    const hasProbeKeywords = PROBE_KEYWORDS.some(keyword => allText.includes(keyword));

    if (hasProbeKeywords) {
      useProbe = true;
      reasoning.push('Detected temperature-based cooking instructions, suggesting probe use.');

      // Try to find specific protein and temperature
      for (const [protein, temp] of Object.entries(PROTEIN_TEMPERATURES)) {
        if (allText.includes(protein)) {
          probeTemp = temp;
          reasoning.push(`Found "${protein}" in recipe, suggesting ${temp}°F target temperature.`);
          break;
        }
      }
    }
  }

  // Create primary cooking action
  const primaryAction: CookingAction = {
    id: `auto_${Date.now()}`,
    applianceId: suggestedAppliance.category_id,
    methodId: bestMethod.method.methodId,
    methodName: bestMethod.method.keywords[0].split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    parameters: {
      ...bestMethod.method.defaultParams,
      ...(useProbe ? { target_probe_temp: probeTemp } : {}),
      // Adjust cooking time based on recipe if available
      cooking_time: bestMethod.method.defaultParams.cooking_time || (cookTime * 60),
    },
  };

  suggestedActions.push(primaryAction);
  reasoning.push(`Suggested ${suggestedAppliance.name} with ${primaryAction.methodName} method.`);

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
      methodId: method.method.methodId,
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