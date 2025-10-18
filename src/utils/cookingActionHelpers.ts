import { CookingAction } from '~/types/chefiq';

// Helper to get cooking method icon
export const getCookingMethodIcon = (methodId: string, applianceType?: string): string => {
  // RJ40 (Smart Cooker) method icons
  const RJ40_METHOD_ICONS: { [key: string]: string } = {
    'pressure_cook': '🍲',
    'saute': '🔥',
    'sear_saute': '🔥',
    'steam': '💨',
    'slow_cook': '🥘',
    'rice': '🍚',
    'keep_warm': '♨️',
    'ferment': '🥛',
    'sterilize': '🧼',
    'sous_vide': '🌊',
    // Legacy method IDs
    '0': '🍲', // Pressure Cook
    '1': '🔥', // Sear/Sauté
    '2': '💨', // Steam
    '3': '🥘', // Slow Cook
    '15': '♨️', // Keep Warm
    '16': '🥛', // Ferment
    '17': '🧼', // Sterilize
    '5': '🌊', // Sous Vide
  };

  // CQ50 (Mini Oven) method icons
  const CQ50_METHOD_ICONS: { [key: string]: string } = {
    'air_fry': '🍟',
    'bake': '🍞',
    'roast': '🍖',
    'broil': '🔥',
    'air_broil': '💨',
    'toast': '🍞',
    'dehydrate': '🍇',
    'proof': '🥖',
    'reheat': '♨️',
    'keep_warm': '🔆',
    'slow_cook': '🥘',
    // Legacy method IDs
    'METHOD_AIR_FRY': '🍟',
    'METHOD_BAKE': '🍞',
    'METHOD_ROAST': '🍖',
    'METHOD_BROIL': '🔥',
    'METHOD_AIR_BROIL': '💨',
    'METHOD_TOAST': '🍞',
    'METHOD_DEHYDRATE': '🍇',
    'METHOD_PROOF': '🥖',
    'METHOD_REHEAT': '♨️',
    'METHOD_KEEP_WARM': '🔆',
    'METHOD_SLOW_COOK': '🥘',
  };

  const icons = applianceType === 'oven' ? CQ50_METHOD_ICONS : RJ40_METHOD_ICONS;
  return icons[methodId] || icons[methodId?.toString()] || '🍳';
};

// Helper to convert temperature level enum to user-friendly string
const getTempLevelDisplay = (tempLevel: any): string => {
  const tempLevelMap: { [key: string]: string } = {
    '1': 'Low',
    '2': 'Medium',
    '3': 'High',
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'Low': 'Low',
    'Medium': 'Medium',
    'High': 'High',
  };

  return tempLevelMap[tempLevel?.toString()] || tempLevel?.toString() || '';
};

// Helper to format key cooking parameters
export const formatKeyParameters = (action: CookingAction): string => {
  const params = action.parameters || {};
  const keyParams: string[] = [];

  // Time parameters
  if (params.time) {
    keyParams.push(`${params.time} min`);
  } else if (params.cooking_time) {
    const minutes = Math.round(params.cooking_time / 60);
    keyParams.push(`${minutes} min`);
  } else if (params.duration) {
    keyParams.push(`${params.duration} min`);
  }

  // Temperature parameters
  if (params.temperature) {
    keyParams.push(`${params.temperature}°F`);
  } else if (params.target_cavity_temp) {
    keyParams.push(`${params.target_cavity_temp}°F`);
  } else if (params.target_probe_temp) {
    // If remove_probe_temp is different from target, show both
    if (params.remove_probe_temp && params.remove_probe_temp !== params.target_probe_temp) {
      keyParams.push(`Probe: ${params.target_probe_temp}°F (remove at ${params.remove_probe_temp}°F)`);
    } else {
      keyParams.push(`Probe: ${params.target_probe_temp}°F`);
    }
  } else if (params.internalTemp) {
    keyParams.push(`Internal: ${params.internalTemp}°F`);
  } else if (params.targetTemperature) {
    keyParams.push(`${params.targetTemperature}°F`);
  }

  // Pressure level (RJ40 specific)
  if (params.pressure) {
    keyParams.push(`${params.pressure} Pressure`);
  } else if (params.pres_level !== undefined) {
    const pressureDisplay = params.pres_level === 1 ? 'High Pressure' : 'Low Pressure';
    keyParams.push(pressureDisplay);
  } else if (params.pressureLevel) {
    const pressureDisplay = params.pressureLevel === 1 ? 'High Pressure' : 'Low Pressure';
    keyParams.push(pressureDisplay);
  }

  // Temperature/Heat level
  if (params.temp_level) {
    const display = getTempLevelDisplay(params.temp_level);
    if (display) keyParams.push(display);
  } else if (params.tempLevel) {
    const display = getTempLevelDisplay(params.tempLevel);
    if (display) keyParams.push(display);
  }

  // Pressure release (RJ40 specific)
  if (params.pres_release !== undefined) {
    const releaseMap: { [key: number]: string } = {
      0: 'Quick Release',
      1: 'Pulse Release',
      2: 'Natural Release'
    };
    keyParams.push(releaseMap[params.pres_release] || 'Quick Release');
  } else if (params.naturalRelease !== undefined) {
    keyParams.push(params.naturalRelease ? 'Natural Release' : 'Quick Release');
  } else if (params.pressureRelease) {
    keyParams.push(`${params.pressureRelease} Release`);
  } else if (params.releaseMethod) {
    keyParams.push(`${params.releaseMethod} Release`);
  }

  // For legacy compatibility, also check direct properties
  if ((action as any).temperature && !params.temperature) {
    keyParams.push(`${(action as any).temperature}°F`);
  }
  if ((action as any).duration && !params.time && !params.cooking_time) {
    keyParams.push(`${(action as any).duration} min`);
  }

  return keyParams.join(' • ');
};