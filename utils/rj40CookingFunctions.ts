enum TWO_LEVEL {
  HIGH = 1,
  LOW = 0,
}

enum PRESSURE_RELEASE {
  QUICK = 0,
  PULSE = 1,
  NATURAL = 2,
}

enum ON_OFF_LEVEL {
  OFF = 0,
  ON = 1,
}

enum FOUR_LEVEL {
  LOW = 0,
  MEDIUM_LOW = 1,
  MEDIUM_HIGH = 2,
  HIGH = 3,
}

export const getSmartCookerDefaultState = (cookingMethod: number) => {
  if (cookingMethod === COOKING_METHOD.PRESSURE) {
    return {
      cooking_method: COOKING_METHOD.PRESSURE,
      pres_level: TWO_LEVEL.HIGH,
      pres_release: PRESSURE_RELEASE.QUICK,
      keep_warm: ON_OFF_LEVEL.ON,
      delay_time: 0,
    };
  }
  if (cookingMethod === COOKING_METHOD.SEAR_SAUTE) {
    return {
      cooking_method: COOKING_METHOD.SEAR_SAUTE,
      temp_level: FOUR_LEVEL.MEDIUM_LOW,
      keep_warm: ON_OFF_LEVEL.OFF,
      delay_time: 0,
    };
  }
  if (cookingMethod === COOKING_METHOD.STEAM) {
    return {
      cooking_method: COOKING_METHOD.STEAM,
      keep_warm: ON_OFF_LEVEL.OFF,
      delay_time: 0,
    };
  }
  if (cookingMethod === COOKING_METHOD.SLOW_COOK) {
    return {
      cooking_method: COOKING_METHOD.SLOW_COOK,
      temp_level: TWO_LEVEL.HIGH,
      keep_warm: ON_OFF_LEVEL.ON,
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
      pres_level: TWO_LEVEL.HIGH,
      pres_release: PRESSURE_RELEASE.QUICK,
      keep_warm: ON_OFF_LEVEL.OFF,
      delay_time: 0,
    };
  }
  return {};
};

const COOKING_METHOD = {
  PRESSURE: 0,
  SEAR_SAUTE: 1,
  STEAM: 2,
  SLOW_COOK: 3,
  DEHYDRATE: 4,
  SOUS_VIDE: 5,
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
