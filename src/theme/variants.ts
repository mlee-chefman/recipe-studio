/**
 * RecipeiQ Theme Variants
 * Three pre-defined color schemes that users can switch between
 */

export type ThemeVariant = 'fresh' | 'professional' | 'warm';

export interface ThemeColors {
  // Primary Green Palette
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };

  // Secondary Palette
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };

  // Neutral Grays
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };

  // Semantic Colors
  success: {
    light: string;
    main: string;
    dark: string;
  };

  warning: {
    light: string;
    main: string;
    dark: string;
  };

  error: {
    light: string;
    main: string;
    dark: string;
  };

  info: {
    light: string;
    main: string;
    dark: string;
  };

  // Background Colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    white: string;
  };

  // Text Colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };

  // Border Colors
  border: {
    light: string;
    main: string;
    dark: string;
    focus: string;
  };

  // Surface Colors
  surface: {
    primary: string;
    secondary: string;
    elevated: string;
    overlay: string;
  };
}

// Option 1: Fresh & Modern - Bright emerald green, white background
export const freshTheme: ThemeColors = {
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main bright emerald
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },

  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#047857',
  },

  warning: {
    light: '#fef3e0',
    main: '#d4a574',
    dark: '#b8864f',
  },

  error: {
    light: '#f5e6e6',
    main: '#c97272',
    dark: '#a85555',
  },

  info: {
    light: '#e6eff2',
    main: '#5a8fa6',
    dark: '#3d6f87',
  },

  background: {
    primary: '#ffffff',
    secondary: '#f5f3e4', // Light cream for cards
    tertiary: '#ecfdf5', // Very light green
    white: '#ffffff',
  },

  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#6b7280',
    disabled: '#9ca3af',
    inverse: '#ffffff',
  },

  border: {
    light: '#f3f4f6',
    main: '#e5e7eb',
    dark: '#d1d5db',
    focus: '#10b981',
  },

  surface: {
    primary: '#ffffff',
    secondary: '#f5f3e4',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

// Option 2: Professional & Clean - Balanced green, gray accents
export const professionalTheme: ThemeColors = {
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#16a34a', // Main professional green
    600: '#15803d',
    700: '#166534',
    800: '#14532d',
    900: '#052e16',
  },

  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },

  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  success: {
    light: '#dcfce7',
    main: '#16a34a',
    dark: '#166534',
  },

  warning: {
    light: '#fef3e0',
    main: '#d4a574',
    dark: '#b8864f',
  },

  error: {
    light: '#f5e6e6',
    main: '#c97272',
    dark: '#a85555',
  },

  info: {
    light: '#e6eff2',
    main: '#5a8fa6',
    dark: '#3d6f87',
  },

  background: {
    primary: '#ffffff',
    secondary: '#f9fafb', // Very light gray
    tertiary: '#f0fdf4', // Very light green
    white: '#ffffff',
  },

  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#6b7280',
    disabled: '#9ca3af',
    inverse: '#ffffff',
  },

  border: {
    light: '#f3f4f6',
    main: '#e5e7eb',
    dark: '#d1d5db',
    focus: '#16a34a',
  },

  surface: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

// Option 3: Warm & Inviting - Vibrant green, warm cream accents
export const warmTheme: ThemeColors = {
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main vibrant green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },

  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
  },

  warning: {
    light: '#fef3e0',
    main: '#d4a574',
    dark: '#b8864f',
  },

  error: {
    light: '#f5e6e6',
    main: '#c97272',
    dark: '#a85555',
  },

  info: {
    light: '#e6eff2',
    main: '#5a8fa6',
    dark: '#3d6f87',
  },

  background: {
    primary: '#ffffff',
    secondary: '#faf8f3', // Warm light cream
    tertiary: '#f0fdf4', // Very light green
    white: '#ffffff',
  },

  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#6b7280',
    disabled: '#9ca3af',
    inverse: '#ffffff',
  },

  border: {
    light: '#f3f4f6',
    main: '#e5e7eb',
    dark: '#d1d5db',
    focus: '#22c55e',
  },

  surface: {
    primary: '#ffffff',
    secondary: '#faf8f3',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

// Theme metadata for display in settings
export const themeMetadata = {
  fresh: {
    name: 'Fresh & Modern',
    description: 'Bright emerald green with clean white backgrounds',
    accentColor: '#10b981',
  },
  professional: {
    name: 'Professional & Clean',
    description: 'Balanced green with subtle gray accents',
    accentColor: '#16a34a',
  },
  warm: {
    name: 'Warm & Inviting',
    description: 'Vibrant green with warm cream tones',
    accentColor: '#22c55e',
  },
};

// Get theme colors by variant
export function getThemeColors(variant: ThemeVariant): ThemeColors {
  switch (variant) {
    case 'fresh':
      return freshTheme;
    case 'professional':
      return professionalTheme;
    case 'warm':
      return warmTheme;
    default:
      return freshTheme;
  }
}
