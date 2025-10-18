/**
 * ChefIQ Temperature Guide for Probe Cooking
 * Provides recommended internal temperatures for different proteins and doneness levels
 */

export interface DonenesLevel {
  nameKey: string;
  shortNameKey?: string;
  targetTemp: number;
  removeTemp?: number; // Temperature to remove from heat (for carryover cooking)
  isUsdaApproved: boolean;
}

export interface TemperatureGuide {
  nameKey: string;
  shortNameKey?: string;
  icon: string;
  doneness: DonenesLevel[];
}

export const TEMPERATURE_GUIDE: TemperatureGuide[] = [
  {
    nameKey: 'poultryWhite',
    shortNameKey: 'poultryWhiteShort',
    icon: 'https://icons.chefiq.com/ico_pu_05.png',
    doneness: [
      {
        nameKey: 'wellDone',
        targetTemp: 165,
        isUsdaApproved: true,
      },
    ],
  },
  {
    nameKey: 'poultryDark',
    shortNameKey: 'poultryDarkShort',
    icon: 'https://icons.chefiq.com/ico_pu_tu_05.png',
    doneness: [
      {
        nameKey: 'wellDone',
        targetTemp: 180,
        isUsdaApproved: true,
      },
    ],
  },
  {
    nameKey: 'beef',
    icon: 'https://icons.chefiq.com/ico_me_be_05.png',
    doneness: [
      {
        nameKey: 'rare',
        targetTemp: 125,
        removeTemp: 120,
        isUsdaApproved: false,
      },
      {
        nameKey: 'mediumRare',
        shortNameKey: 'mediumRareShort',
        targetTemp: 135,
        removeTemp: 130,
        isUsdaApproved: false,
      },
      {
        nameKey: 'medium',
        targetTemp: 145,
        removeTemp: 140,
        isUsdaApproved: true,
      },
      {
        nameKey: 'mediumWell',
        shortNameKey: 'mediumWellShort',
        targetTemp: 155,
        removeTemp: 150,
        isUsdaApproved: true,
      },
      {
        nameKey: 'wellDone',
        targetTemp: 165,
        removeTemp: 160,
        isUsdaApproved: true,
      },
      {
        nameKey: 'bbqTender',
        shortNameKey: 'bbqTenderShort',
        targetTemp: 205,
        removeTemp: 200,
        isUsdaApproved: true,
      },
    ],
  },
  {
    nameKey: 'pork',
    icon: 'https://icons.chefiq.com/ico_me_po_05.png',
    doneness: [
      {
        nameKey: 'medium',
        targetTemp: 145,
        removeTemp: 140,
        isUsdaApproved: true,
      },
      {
        nameKey: 'mediumWell',
        shortNameKey: 'mediumWellShort',
        targetTemp: 150,
        removeTemp: 145,
        isUsdaApproved: true,
      },
      {
        nameKey: 'wellDone',
        targetTemp: 160,
        removeTemp: 155,
        isUsdaApproved: true,
      },
      {
        nameKey: 'bbqTender',
        shortNameKey: 'bbqTenderShort',
        targetTemp: 205,
        removeTemp: 200,
        isUsdaApproved: true,
      },
    ],
  },
  {
    nameKey: 'lamb',
    icon: 'https://icons.chefiq.com/ico_me_la_05.png',
    doneness: [
      {
        nameKey: 'rare',
        targetTemp: 125,
        removeTemp: 120,
        isUsdaApproved: false,
      },
      {
        nameKey: 'mediumRare',
        shortNameKey: 'mediumRareShort',
        targetTemp: 135,
        removeTemp: 130,
        isUsdaApproved: false,
      },
      {
        nameKey: 'medium',
        targetTemp: 145,
        removeTemp: 140,
        isUsdaApproved: true,
      },
      {
        nameKey: 'mediumWell',
        shortNameKey: 'mediumWellShort',
        targetTemp: 155,
        removeTemp: 150,
        isUsdaApproved: true,
      },
      {
        nameKey: 'wellDone',
        targetTemp: 165,
        removeTemp: 160,
        isUsdaApproved: true,
      },
      {
        nameKey: 'bbqTender',
        shortNameKey: 'bbqTenderShort',
        targetTemp: 205,
        removeTemp: 200,
        isUsdaApproved: true,
      },
    ],
  },
  {
    nameKey: 'veal',
    icon: 'https://icons.chefiq.com/ico_me_vl_05.png',
    doneness: [
      {
        nameKey: 'mediumRare',
        shortNameKey: 'mediumRareShort',
        targetTemp: 135,
        removeTemp: 130,
        isUsdaApproved: false,
      },
      {
        nameKey: 'medium',
        targetTemp: 145,
        removeTemp: 140,
        isUsdaApproved: true,
      },
      {
        nameKey: 'mediumWell',
        shortNameKey: 'mediumWellShort',
        targetTemp: 155,
        removeTemp: 150,
        isUsdaApproved: true,
      },
      {
        nameKey: 'wellDone',
        targetTemp: 165,
        removeTemp: 160,
        isUsdaApproved: true,
      },
      {
        nameKey: 'bbqTender',
        shortNameKey: 'bbqTenderShort',
        targetTemp: 205,
        removeTemp: 200,
        isUsdaApproved: true,
      },
    ],
  },
  {
    nameKey: 'groundMeat',
    icon: 'https://icons.chefiq.com/ico_me_be_ground_05.png',
    doneness: [
      {
        nameKey: 'rare',
        targetTemp: 125,
        removeTemp: 120,
        isUsdaApproved: false,
      },
      {
        nameKey: 'mediumRare',
        shortNameKey: 'mediumRareShort',
        targetTemp: 135,
        removeTemp: 130,
        isUsdaApproved: false,
      },
      {
        nameKey: 'medium',
        targetTemp: 145,
        removeTemp: 140,
        isUsdaApproved: false,
      },
      {
        nameKey: 'mediumWell',
        shortNameKey: 'mediumWellShort',
        targetTemp: 155,
        removeTemp: 150,
        isUsdaApproved: false,
      },
      {
        nameKey: 'wellDone',
        targetTemp: 165,
        isUsdaApproved: true,
      },
    ],
  },
  {
    nameKey: 'fish',
    icon: 'https://icons.chefiq.com/ico_sf_fi_05.png',
    doneness: [
      {
        nameKey: 'rare',
        targetTemp: 120,
        removeTemp: 115,
        isUsdaApproved: false,
      },
      {
        nameKey: 'mediumRare',
        shortNameKey: 'mediumRareShort',
        targetTemp: 125,
        removeTemp: 120,
        isUsdaApproved: false,
      },
      {
        nameKey: 'medium',
        targetTemp: 130,
        removeTemp: 125,
        isUsdaApproved: false,
      },
      {
        nameKey: 'mediumWell',
        shortNameKey: 'mediumWellShort',
        targetTemp: 135,
        removeTemp: 130,
        isUsdaApproved: false,
      },
      {
        nameKey: 'wellDone',
        targetTemp: 145,
        removeTemp: 140,
        isUsdaApproved: true,
      },
    ],
  },
];

// Human-readable labels for display
export const PROTEIN_LABELS: Record<string, string> = {
  poultryWhite: 'Chicken (White Meat)',
  poultryWhiteShort: 'Chicken White',
  poultryDark: 'Chicken (Dark Meat)',
  poultryDarkShort: 'Chicken Dark',
  beef: 'Beef',
  pork: 'Pork',
  lamb: 'Lamb',
  veal: 'Veal',
  groundMeat: 'Ground Meat',
  fish: 'Fish',
};

export const DONENESS_LABELS: Record<string, string> = {
  rare: 'Rare',
  mediumRare: 'Medium Rare',
  mediumRareShort: 'Med Rare',
  medium: 'Medium',
  mediumWell: 'Medium Well',
  mediumWellShort: 'Med Well',
  wellDone: 'Well Done',
  bbqTender: 'BBQ Tender',
  bbqTenderShort: 'BBQ',
};

/**
 * Helper to detect protein type from recipe text
 */
export function detectProteinType(text: string): TemperatureGuide | null {
  const textLower = text.toLowerCase();

  // Check for each protein type
  if (textLower.includes('chicken breast') || textLower.includes('turkey breast')) {
    return TEMPERATURE_GUIDE.find(g => g.nameKey === 'poultryWhite') || null;
  }
  if (textLower.includes('chicken thigh') || textLower.includes('chicken leg') ||
      textLower.includes('turkey thigh') || textLower.includes('turkey leg')) {
    return TEMPERATURE_GUIDE.find(g => g.nameKey === 'poultryDark') || null;
  }
  if (textLower.includes('chicken') || textLower.includes('turkey')) {
    return TEMPERATURE_GUIDE.find(g => g.nameKey === 'poultryWhite') || null;
  }
  if (textLower.includes('ground beef') || textLower.includes('ground pork') ||
      textLower.includes('ground lamb') || textLower.includes('hamburger') ||
      textLower.includes('burger')) {
    return TEMPERATURE_GUIDE.find(g => g.nameKey === 'groundMeat') || null;
  }
  if (textLower.includes('beef') || textLower.includes('steak') || textLower.includes('brisket')) {
    return TEMPERATURE_GUIDE.find(g => g.nameKey === 'beef') || null;
  }
  if (textLower.includes('pork') || textLower.includes('ham')) {
    return TEMPERATURE_GUIDE.find(g => g.nameKey === 'pork') || null;
  }
  if (textLower.includes('lamb')) {
    return TEMPERATURE_GUIDE.find(g => g.nameKey === 'lamb') || null;
  }
  if (textLower.includes('veal')) {
    return TEMPERATURE_GUIDE.find(g => g.nameKey === 'veal') || null;
  }
  if (textLower.includes('fish') || textLower.includes('salmon') ||
      textLower.includes('tuna') || textLower.includes('halibut')) {
    return TEMPERATURE_GUIDE.find(g => g.nameKey === 'fish') || null;
  }

  return null;
}

/**
 * Helper to find closest matching doneness level for a given temperature
 */
export function findDonenessForTemp(
  protein: TemperatureGuide,
  temperature: number
): DonenesLevel | null {
  if (!protein || !protein.doneness) return null;

  // Find the closest doneness level
  let closest = protein.doneness[0];
  let minDiff = Math.abs(closest.targetTemp - temperature);

  for (const doneness of protein.doneness) {
    const diff = Math.abs(doneness.targetTemp - temperature);
    if (diff < minDiff) {
      minDiff = diff;
      closest = doneness;
    }
  }

  // Only return if temperature is within 10°F of a valid doneness level
  return minDiff <= 10 ? closest : null;
}

/**
 * Get USDA recommended temperature for a protein (defaults to first USDA approved option)
 */
export function getUsdaRecommendedTemp(protein: TemperatureGuide): number {
  const usdaApproved = protein.doneness.find(d => d.isUsdaApproved);
  return usdaApproved?.targetTemp || protein.doneness[0].targetTemp;
}
