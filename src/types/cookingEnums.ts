// Centralized cooking parameter enums for ChefIQ appliances

// Fan Speed levels for oven cooking methods
export enum FanSpeed {
  Off = 0,
  Low = 1,
  Medium = 2,
  High = 3,
}

// Temperature levels for methods that use relative heat settings
export enum TemperatureLevel {
  Low = 0,
  MediumLow = 1,
  MediumHigh = 2,
  High = 3,
}

// Pressure levels for pressure cooking
export enum PressureLevel {
  Low = 0,
  High = 1,
}

// Pressure release methods
export enum PressureRelease {
  Quick = 0,
  Pulse = 1,
  Natural = 2,
}

// Keep warm setting
export enum KeepWarm {
  Off = 0,
  On = 1,
}

// Shade levels for toasting
export enum ShadeLevel {
  Light = 0,
  MediumLight = 1,
  Medium = 2,
  MediumDark = 3,
  Dark = 4,
}

// Cooking methods for iQ Cooker (RJ40)
export enum CookerMethod {
  Pressure = 0,
  SearSaute = 1,
  Steam = 2,
  SlowCook = 3,
  Dehydrate = 4,
  SousVide = 5,
}

// Cooking methods for iQ MiniOven (CQ50)
export enum OvenMethod {
  AirFry = 'METHOD_AIR_FRY',
  Bake = 'METHOD_BAKE',
  Roast = 'METHOD_ROAST',
  Broil = 'METHOD_BROIL',
  Toast = 'METHOD_TOAST',
  Dehydrate = 'METHOD_DEHYDRATE',
}

// Helper functions to get descriptive names
export const FanSpeedNames = {
  [FanSpeed.Off]: 'Off',
  [FanSpeed.Low]: 'Low',
  [FanSpeed.Medium]: 'Medium',
  [FanSpeed.High]: 'High',
} as const;

export const TemperatureLevelNames = {
  [TemperatureLevel.Low]: 'Low',
  [TemperatureLevel.MediumLow]: 'Medium-Low',
  [TemperatureLevel.MediumHigh]: 'Medium-High',
  [TemperatureLevel.High]: 'High',
} as const;

export const PressureLevelNames = {
  [PressureLevel.Low]: 'Low Pressure',
  [PressureLevel.High]: 'High Pressure',
} as const;

export const PressureReleaseNames = {
  [PressureRelease.Quick]: 'Quick Release',
  [PressureRelease.Pulse]: 'Pulse Release',
  [PressureRelease.Natural]: 'Natural Release',
} as const;

export const ShadeLevelNames = {
  [ShadeLevel.Light]: 'Light',
  [ShadeLevel.MediumLight]: 'Medium-Light',
  [ShadeLevel.Medium]: 'Medium',
  [ShadeLevel.MediumDark]: 'Medium-Dark',
  [ShadeLevel.Dark]: 'Dark',
} as const;