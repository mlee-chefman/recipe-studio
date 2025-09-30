import {
  PressureLevel,
  PressureRelease,
  KeepWarm,
  TemperatureLevel,
  CookerMethod
} from '../types/cookingEnums';

export const getSmartCookerDefaultState = (cookingMethod: number) => {
  if (cookingMethod === COOKING_METHOD.PRESSURE) {
    return {
      cooking_method: COOKING_METHOD.PRESSURE,
      pres_level: PressureLevel.High,
      pres_release: PressureRelease.Quick,
      keep_warm: KeepWarm.On,
      delay_time: 0,
    };
  }
  if (cookingMethod === COOKING_METHOD.SEAR_SAUTE) {
    return {
      cooking_method: COOKING_METHOD.SEAR_SAUTE,
      temp_level: TemperatureLevel.MediumLow,
      keep_warm: KeepWarm.Off,
      delay_time: 0,
    };
  }
  if (cookingMethod === COOKING_METHOD.STEAM) {
    return {
      cooking_method: COOKING_METHOD.STEAM,
      keep_warm: KeepWarm.Off,
      delay_time: 0,
    };
  }
  if (cookingMethod === COOKING_METHOD.SLOW_COOK) {
    return {
      cooking_method: COOKING_METHOD.SLOW_COOK,
      temp_level: TemperatureLevel.High,
      keep_warm: KeepWarm.On,
      delay_time: 0,
    };
  }
  if (cookingMethod === COOKING_METHOD.FERMENT) {
    return {
      cooking_method: COOKING_METHOD.FERMENT,
      delay_time: 0,
    };
  }
  if (cookingMethod === COOKING_METHOD.KEEP_WARM) {
    return {
      cooking_method: COOKING_METHOD.KEEP_WARM,
      delay_time: 0,
    };
  }
  if (cookingMethod === COOKING_METHOD.SOUS_VIDE) {
    return {
      cooking_method: COOKING_METHOD.SOUS_VIDE,
      delay_time: 0,
    };
  }
  if (cookingMethod === COOKING_METHOD.STERILIZE) {
    return {
      cooking_method: COOKING_METHOD.STERILIZE,
      pres_level: PressureLevel.High,
      pres_release: PressureRelease.Quick,
      keep_warm: KeepWarm.Off,
      delay_time: 0,
    };
  }
  return {};
};

const COOKING_METHOD = {
  PRESSURE: CookerMethod.Pressure,
  SEAR_SAUTE: CookerMethod.SearSaute,
  STEAM: CookerMethod.Steam,
  SLOW_COOK: CookerMethod.SlowCook,
  DEHYDRATE: CookerMethod.Dehydrate,
  SOUS_VIDE: CookerMethod.SousVide,
  AIR_FRY: 6,
  TOAST: 7,
  BAGEL: 8,
  BROIL: 9,
  CONVECTION_BROIL: 10,
  BAKE: 11,
  CONVECTION_BAKE: 12,
  ROAST: 13,
  GRILL: 14,
  KEEP_WARM: 15,
  FERMENT: 16,
  STERILIZE: 17,
};

export const cookingFunctions = {
  [COOKING_METHOD.PRESSURE]: {
    cookingTime: {
      default: 900,
      min: 0,
      max: 14400,
      granularity: 60,
    },
  },
  [COOKING_METHOD.SEAR_SAUTE]: {
    cookingTime: {
      default: 1800,
      min: 60,
      max: 3600,
      granularity: 60,
    },
  },
  [COOKING_METHOD.STEAM]: {
    cookingTime: {
      default: 600,
      min: 60,
      max: 3600,
      granularity: 60,
    },
  },
  [COOKING_METHOD.SLOW_COOK]: {
    cookingTime: {
      default: 14400,
      min: 1800,
      max: 86400,
      granularity: 1800,
    },
  },
  [COOKING_METHOD.KEEP_WARM]: {
    cookingTime: {
      default: 1800,
      min: 1800,
      max: 259200,
      granularity: 1800,
    },
  },
  [COOKING_METHOD.FERMENT]: {
    cookingTime: {
      default: 28800,
      min: 3600,
      max: 86400,
      granularity: 1800,
    },
    cookingTemp: {
      default: 110,
      min: 75,
      max: 110,
      granularity: 1,
    },
  },
  [COOKING_METHOD.STERILIZE]: {
    cookingTime: {
      default: 600,
      min: 0,
      max: 14400,
      granularity: 60,
    },
  },
  [COOKING_METHOD.SOUS_VIDE]: {
    cookingTime: {
      default: 3600,
      min: 60,
      max: 259200,
      granularity: 60,
    },
    cookingTemp: {
      default: 140,
      min: 110,
      max: 200,
      granularity: 1,
    },
  },
};
