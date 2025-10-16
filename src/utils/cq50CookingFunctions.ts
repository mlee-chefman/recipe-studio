import {
  FanSpeed,
  TemperatureLevel,
  ShadeLevel,
  OvenMethod
} from '~/types/cookingEnums';

const FtoC = (temp: number, roundBy = 1): number => {
  const convertedTemp = (temp - 32) / 1.8;
  if (roundBy === 0) return parseFloat(convertedTemp.toFixed(2));
  return Math.round(convertedTemp / roundBy) * roundBy;
};

enum CookingMethod {
  AirFry = 'METHOD_AIR_FRY',
  Bake = 'METHOD_BAKE',
  Roast = 'METHOD_ROAST',
  Broil = 'METHOD_BROIL',
  AirBroil = 'METHOD_AIR_BROIL',
  Toast = 'METHOD_TOAST',
  Dehydrate = 'METHOD_DEHYDRATE',
  Proof = 'METHOD_PROOF',
  Reheat = 'METHOD_REHEAT',
  KeepWarm = 'METHOD_KEEP_WARM',
  SlowCook = 'METHOD_SLOW_COOK',
}

enum RackAccessory {
  AirFryBasket = 'ACCESSORY_AIR_FRY_BASKET',
  CrumbTray = 'ACCESSORY_CRUMB_TRAY',
  DehydrateRack = 'ACCESSORY_DEHYDRATE_RACK',
  EggTray = 'ACCESSORY_EGG_TRAY',
  GlideRail = 'ACCESSORY_GLIDE_RAIL',
  SheetTray = 'ACCESSORY_SHEET_TRAY',
  WireRack = 'ACCESSORY_WIRE_RACK',
}

enum RackPosition {
  NoRack = 'noRack',
  Bottom = 'bottom',
  Middle = 'middle',
  Top = 'top',
}

enum TempUnit {
  F,
  C,
}
enum ReheatPresets {
  CustomReheat = 'CUSTOM_REHEAT',
  FriedFoods = 'FRIED_FOODS',
  BakedDishes = 'BAKED_DISHES',
  BakedGoods = 'BAKED_GOODS',
  RoastedMeats = 'ROASTED_MEATS',
  RoastedVegetables = 'ROASTED_VEGETABLES',
  Pizza = 'PIZZA',
  Sandwiches = 'SANDWICHES',
}

const probeSettings = {
  target_temp: {
    [TempUnit.F]: {
      default: 145,
      min: 75,
      max: 210,
      granularity: 1,
    },
    [TempUnit.C]: {
      default: 62,
      min: 24,
      max: 98,
      granularity: 1,
    },
  },
  remove_temp: {
    [TempUnit.F]: {
      min: 75,
      max: 210,
      granularity: 1,
    },
    [TempUnit.C]: {
      min: 24,
      max: 99,
      granularity: 1,
    },
  },
  rest_time: {
    min: 60,
    max: 21540,
    granularity: 60,
  },
};

const REHEAT_PROBE_TEMP = 165;

export const cookingFunctions = {
  [CookingMethod.AirFry]: {
    name: 'Air Fry',
    icon: 'airFry',
    cooking_method: CookingMethod.AirFry,
    settings: {
      multi_cook_option: true,
      probe_settings: probeSettings,
      rack_position: RackPosition.Middle,
      rack_accessories: [RackAccessory.AirFryBasket],
      keep_warm: {
        default: false,
      },
      auto_start: {
        default: true,
      },
      target_cavity_temp: {
        [TempUnit.F]: {
          default: 375,
          min: 300,
          max: 450,
          granularity: 5,
        },
        [TempUnit.C]: {
          default: 190,
          min: 150,
          max: 234,
          granularity: 2,
        },
      },
      cooking_time: {
        default: 1800,
        min: 60,
        max: 3540,
        granularity: 60,
      },
      fan_speed: {
        default: FanSpeed.High,
      },
    },
  },
  [CookingMethod.Bake]: {
    name: 'Bake',
    icon: 'bake',
    cooking_method: CookingMethod.Bake,
    settings: {
      multi_cook_option: true,
      probe_settings: probeSettings,
      rack_position: RackPosition.Middle,
      rack_accessories: [RackAccessory.SheetTray],
      keep_warm: {
        default: false,
      },
      auto_start: {
        default: true,
      },
      target_cavity_temp: {
        [TempUnit.F]: {
          default: 350,
          min: 200,
          max: 500,
          granularity: 5,
        },
        [TempUnit.C]: {
          default: 176,
          min: 90,
          max: 260,
          granularity: 2,
        },
      },
      cooking_time: {
        default: 1800,
        min: 60,
        max: 14340,
        granularity: 60,
      },
      fan_speed: {
        default: FanSpeed.Low,
        options: [FanSpeed.Off, FanSpeed.Low, FanSpeed.Medium, FanSpeed.High],
      },
    },
  },
  [CookingMethod.Roast]: {
    name: 'Roast',
    icon: 'roast',
    cooking_method: CookingMethod.Roast,
    settings: {
      multi_cook_option: true,
      probe_settings: probeSettings,
      rack_position: RackPosition.Middle,
      rack_accessories: [RackAccessory.SheetTray],
      keep_warm: {
        default: false,
      },
      auto_start: {
        default: true,
      },
      target_cavity_temp: {
        [TempUnit.F]: {
          default: 350,
          min: 200,
          max: 500,
          granularity: 5,
        },
        [TempUnit.C]: {
          default: 176,
          min: 90,
          max: 260,
          granularity: 2,
        },
      },
      cooking_time: {
        default: 1800,
        min: 60,
        max: 14340,
        granularity: 60,
      },
      fan_speed: {
        default: FanSpeed.Medium,
        options: [FanSpeed.Off, FanSpeed.Low, FanSpeed.Medium, FanSpeed.High],
      },
    },
  },
  [CookingMethod.Broil]: {
    name: 'Broil',
    icon: 'broil',
    cooking_method: CookingMethod.Broil,
    settings: {
      multi_cook_option: true,
      probe_settings: probeSettings,
      rack_position: RackPosition.Top,
      rack_accessories: [RackAccessory.SheetTray],
      keep_warm: {
        default: false,
      },
      auto_start: {
        default: true,
      },
      temp_level: {
        default: TemperatureLevel.High,
        options: [TemperatureLevel.Low, TemperatureLevel.High],
      },
      cooking_time: {
        default: 900,
        min: 60,
        max: 1800,
        granularity: 60,
      },
    },
  },
  [CookingMethod.AirBroil]: {
    name: 'Air Broil',
    icon: 'airBroil',
    cooking_method: CookingMethod.AirBroil,
    settings: {
      multi_cook_option: true,
      probe_settings: probeSettings,
      rack_position: RackPosition.Top,
      rack_accessories: [RackAccessory.SheetTray],
      keep_warm: {
        default: false,
      },
      auto_start: {
        default: true,
      },
      temp_level: {
        default: TemperatureLevel.High,
        options: [TemperatureLevel.Low, TemperatureLevel.High],
      },
      cooking_time: {
        default: 900,
        min: 60,
        max: 1800,
        granularity: 60,
      },
      fan_speed: {
        default: FanSpeed.High,
        options: [FanSpeed.Low, FanSpeed.Medium, FanSpeed.High],
      },
    },
  },
  [CookingMethod.Toast]: {
    name: 'Toast',
    icon: 'toast',
    cooking_method: CookingMethod.Toast,
    settings: {
      multi_cook_option: false,
      rack_position: RackPosition.Middle,
      rack_accessories: [RackAccessory.CrumbTray],
      auto_start: {
        default: true,
      },
      shade_level: {
        default: ShadeLevel.Medium,
        options: [
          ShadeLevel.Light,
          ShadeLevel.MediumLight,
          ShadeLevel.Medium,
          ShadeLevel.MediumDark,
          ShadeLevel.Dark,
        ],
      },
      is_frozen: {
        default: false,
      },
      is_bagel: {
        default: false,
      },
    },
  },
  [CookingMethod.Dehydrate]: {
    name: 'Dehydrate',
    icon: 'dehydrate',
    cooking_method: CookingMethod.Dehydrate,
    settings: {
      multi_cook_option: false,
      rack_position: RackPosition.Middle,
      rack_accessories: [RackAccessory.DehydrateRack],
      auto_start: {
        default: true,
      },
      target_cavity_temp: {
        [TempUnit.F]: {
          default: 130,
          min: 95,
          max: 165,
          granularity: 5,
        },
        [TempUnit.C]: {
          default: 54,
          min: 34,
          max: 74,
          granularity: 2,
        },
      },
      cooking_time: {
        default: 43200,
        min: 60,
        max: 259140,
        granularity: 60,
      },
      fan_speed: {
        default: FanSpeed.Low,
        options: [FanSpeed.Low, FanSpeed.Medium],
      },
    },
  },
  [CookingMethod.Proof]: {
    name: 'Proof',
    icon: 'proofing',
    cooking_method: CookingMethod.Proof,
    settings: {
      multi_cook_option: true,
      rack_position: RackPosition.Middle,
      rack_accessories: [RackAccessory.SheetTray],
      auto_start: {
        default: true,
      },
      target_cavity_temp: {
        [TempUnit.F]: {
          default: 100,
          min: 70,
          max: 130,
          granularity: 5,
        },
        [TempUnit.C]: {
          default: 38,
          min: 20,
          max: 56,
          granularity: 2,
        },
      },
      cooking_time: {
        default: 7200,
        min: 60,
        max: 14340,
        granularity: 60,
      },
    },
  },
  [CookingMethod.Reheat]: {
    name: 'Reheat',
    icon: 'reheat',
    cooking_method: CookingMethod.Reheat,
    settings: {
      multi_cook_option: false,
      rack_position: RackPosition.Middle,
      rack_accessories: [RackAccessory.WireRack],
      keep_warm: {
        default: false,
      },
      target_cavity_temp: {
        [TempUnit.F]: {
          default: 350,
          min: 200,
          max: 400,
          granularity: 5,
        },
        [TempUnit.C]: {
          default: 176,
          min: 95,
          max: 205,
          granularity: 2,
        },
      },
      cooking_time: {
        default: 900,
        min: 60,
        max: 3540,
        granularity: 60,
      },
      fan_speed: {
        default: FanSpeed.Low,
        options: [FanSpeed.Off, FanSpeed.Low, FanSpeed.Medium, FanSpeed.High],
      },
      probe_settings: {
        ...probeSettings,
        target_temp: {
          ...probeSettings.target_temp,
          [TempUnit.F]: {
            ...probeSettings.target_temp[TempUnit.F],
            default: REHEAT_PROBE_TEMP,
          },
          [TempUnit.C]: {
            ...probeSettings.target_temp[TempUnit.C],
            default: FtoC(REHEAT_PROBE_TEMP),
          },
        },
      },
    },
    presets: [
      {
        name: 'Fried Food',
        icon: 'friedFood',
        cooking_preset: ReheatPresets.FriedFoods,
        target_cavity_temp: 375,
        cooking_time: 900,
        fan_speed: FanSpeed.High,
        rack_position: RackPosition.Middle,
        rack_accessories: [RackAccessory.AirFryBasket],
        probe_target_temp: REHEAT_PROBE_TEMP,
      },
      {
        name: 'Baked Dishes',
        icon: 'chickenLeg',
        cooking_preset: ReheatPresets.BakedDishes,
        target_cavity_temp: 350,
        cooking_time: 1200,
        fan_speed: FanSpeed.Low,
        rack_position: RackPosition.Middle,
        rack_accessories: [RackAccessory.SheetTray],
        probe_target_temp: REHEAT_PROBE_TEMP,
      },
      {
        name: 'Baked Goods',
        icon: 'bakedGoods',
        cooking_preset: ReheatPresets.BakedGoods,
        target_cavity_temp: 325,
        cooking_time: 300,
        fan_speed: FanSpeed.Low,
        rack_position: RackPosition.Middle,
        rack_accessories: [RackAccessory.WireRack],
        probe_target_temp: REHEAT_PROBE_TEMP,
      },
      {
        name: 'Roasted Meats',
        icon: 'meat',
        cooking_preset: ReheatPresets.RoastedMeats,
        target_cavity_temp: 350,
        cooking_time: 2700,
        fan_speed: FanSpeed.Medium,
        rack_position: RackPosition.Bottom,
        rack_accessories: [RackAccessory.SheetTray],
        probe_target_temp: REHEAT_PROBE_TEMP,
      },
      {
        name: 'Roasted Vegetables',
        icon: 'mixedVegetables',
        cooking_preset: ReheatPresets.RoastedVegetables,
        target_cavity_temp: 400,
        cooking_time: 720,
        fan_speed: FanSpeed.Medium,
        rack_position: RackPosition.Middle,
        rack_accessories: [RackAccessory.SheetTray],
        probe_target_temp: REHEAT_PROBE_TEMP,
      },
      {
        name: 'Pizza',
        icon: 'pizza',
        cooking_preset: ReheatPresets.Pizza,
        target_cavity_temp: 400,
        cooking_time: 540,
        fan_speed: FanSpeed.Low,
        rack_position: RackPosition.Middle,
        rack_accessories: [RackAccessory.WireRack],
        probe_target_temp: REHEAT_PROBE_TEMP,
      },
      {
        name: 'Sandwiches',
        icon: 'sandwich',
        cooking_preset: ReheatPresets.Sandwiches,
        target_cavity_temp: 350,
        cooking_time: 300,
        fan_speed: FanSpeed.Medium,
        rack_position: RackPosition.Middle,
        rack_accessories: [RackAccessory.SheetTray],
        probe_target_temp: REHEAT_PROBE_TEMP,
      },
    ],
  },
  [CookingMethod.KeepWarm]: {
    name: 'Keep Warm',
    icon: 'keepWarm',
    cooking_method: CookingMethod.KeepWarm,
    settings: {
      multi_cook_option: false,
      rack_position: RackPosition.Middle,
      auto_start: {
        default: true,
      },
      target_cavity_temp: {
        [TempUnit.F]: {
          default: 155,
          min: 110,
          max: 200,
          granularity: 5,
        },
        [TempUnit.C]: {
          default: 68,
          min: 44,
          max: 90,
          granularity: 2,
        },
      },
      cooking_time: {
        default: 7200,
        min: 60,
        max: 14340,
        granularity: 60,
      },
      fan_speed: {
        default: FanSpeed.Low,
        options: [FanSpeed.Off, FanSpeed.Low, FanSpeed.Medium, FanSpeed.High],
      },
      probe_settings: {
        ...probeSettings,
        target_temp: {
          ...probeSettings.target_temp,
          [TempUnit.F]: {
            ...probeSettings.target_temp[TempUnit.F],
            default: 155,
          },
          [TempUnit.C]: {
            ...probeSettings.target_temp[TempUnit.C],
            default: 68,
          },
        },
      },
    },
  },
  [CookingMethod.SlowCook]: {
    name: 'Slow Cook',
    icon: 'slowCook',
    cooking_method: CookingMethod.SlowCook,
    settings: {
      multi_cook_option: true,
      rack_position: RackPosition.Bottom,
      rack_accessories: [RackAccessory.GlideRail],
      auto_start: {
        default: true,
      },
      keep_warm: {
        default: false,
      },
      temp_level: {
        default: TemperatureLevel.High,
        options: [TemperatureLevel.Low, TemperatureLevel.High],
      },
      cooking_time: {
        default: 43200,
        min: 60,
        max: 86340,
        granularity: 60,
      },
      fan_speed: {
        default: FanSpeed.Low,
        options: [FanSpeed.Off, FanSpeed.Low],
      },
      probe_settings: probeSettings,
    },
  },
};
