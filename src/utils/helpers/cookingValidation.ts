import { cookingFunctions as rj40Functions } from '@utils/rj40CookingFunctions';
import { cookingFunctions as cq50Functions } from '@utils/cq50CookingFunctions';

export interface ValidationErrors {
  [key: string]: string;
}

export interface Parameters {
  cooking_time?: number;
  cooking_temp?: number;
  target_cavity_temp?: number;
  target_probe_temp?: number;
  remove_probe_temp?: number;
  pres_level?: number;
  pres_release?: number;
  keep_warm?: number | boolean;
  fan_speed?: number;
  temp_level?: number;
  shade_level?: number;
  auto_start?: boolean;
}

/**
 * Validates a single parameter for RJ40 (Smart Cooker)
 */
export const validateRJ40Parameter = (
  key: string,
  value: any,
  selectedMethod: any
): string | null => {
  // Allow empty strings during editing - don't validate
  if (value === '' || value === undefined || value === null) {
    return null;
  }

  const methodSettings = rj40Functions[selectedMethod];
  if (!methodSettings) return null;

  if (key === 'cooking_time' && methodSettings.cookingTime) {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return 'Cooking time must be a number';
    if (numValue < methodSettings.cookingTime.min) {
      return `Cooking time must be at least ${Math.floor(methodSettings.cookingTime.min / 60)} minutes`;
    }
    if (numValue > methodSettings.cookingTime.max) {
      return `Cooking time must not exceed ${Math.floor(methodSettings.cookingTime.max / 60)} minutes`;
    }
  }

  if (key === 'cooking_temp' && methodSettings.cookingTemp) {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return 'Temperature must be a number';
    if (numValue < methodSettings.cookingTemp.min) {
      return `Temperature must be at least ${methodSettings.cookingTemp.min}°F`;
    }
    if (numValue > methodSettings.cookingTemp.max) {
      return `Temperature must not exceed ${methodSettings.cookingTemp.max}°F`;
    }
  }

  return null;
};

/**
 * Validates a single parameter for CQ50 (Smart Oven)
 */
export const validateCQ50Parameter = (
  key: string,
  value: any,
  selectedMethod: any,
  useProbe: boolean,
  parameters: Parameters
): string | null => {
  // Allow empty strings during editing - don't validate
  if (value === '' || value === undefined || value === null) {
    return null;
  }

  const methodSettings = cq50Functions[selectedMethod];
  if (!methodSettings) return null;

  if (key === 'cooking_time' && methodSettings.settings?.cooking_time) {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return 'Cooking time must be a number';
    if (numValue < methodSettings.settings.cooking_time.min) {
      return `Cooking time must be at least ${Math.floor(methodSettings.settings.cooking_time.min / 60)} minutes`;
    }
    if (numValue > methodSettings.settings.cooking_time.max) {
      return `Cooking time must not exceed ${Math.floor(methodSettings.settings.cooking_time.max / 60)} minutes`;
    }
  }

  if (key === 'target_cavity_temp' && methodSettings.settings?.target_cavity_temp) {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return 'Temperature must be a number';
    const tempSettings = methodSettings.settings.target_cavity_temp[0];
    if (numValue < tempSettings.min) {
      return `Temperature must be at least ${tempSettings.min}°F`;
    }
    if (numValue > tempSettings.max) {
      return `Temperature must not exceed ${tempSettings.max}°F`;
    }
  }

  if (key === 'target_probe_temp' && useProbe) {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return 'Temperature must be a number';
    if (numValue < 100) {
      return 'Probe temperature must be at least 100°F';
    }
    if (numValue > 300) {
      return 'Probe temperature must not exceed 300°F';
    }
  }

  if (key === 'remove_probe_temp' && useProbe) {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return 'Temperature must be a number';
    if (numValue < 100) {
      return 'Remove temperature must be at least 100°F';
    }
    if (parameters.target_probe_temp && numValue > parameters.target_probe_temp) {
      return `Remove temperature must not exceed target temperature (${parameters.target_probe_temp}°F)`;
    }
  }

  return null;
};

/**
 * Validates both probe temperatures together and returns errors for both
 */
export const validateBothProbeTemps = (
  targetTemp: number,
  removeTemp: number
): { targetError: string | null; removeError: string | null } => {
  let targetError: string | null = null;
  let removeError: string | null = null;

  // Validate target temp
  const targetValue = parseInt(targetTemp.toString());
  if (isNaN(targetValue)) {
    targetError = 'Temperature must be a number';
  } else if (targetValue < 100) {
    targetError = 'Probe temperature must be at least 100°F';
  } else if (targetValue > 300) {
    targetError = 'Probe temperature must not exceed 300°F';
  }

  // Validate remove temp against the target temp
  const removeValue = parseInt(removeTemp.toString());
  if (isNaN(removeValue)) {
    removeError = 'Temperature must be a number';
  } else if (removeValue < 100) {
    removeError = 'Remove temperature must be at least 100°F';
  } else if (removeValue > targetTemp) {
    removeError = `Remove temperature must not exceed target temperature (${targetTemp}°F)`;
  }

  return { targetError, removeError };
};
