/**
 * RecipeiQ Theme Variants
 * Three pre-defined color schemes that users can switch between
 */

export type ThemeVariant = 'fresh' | 'fall' | 'ocean';

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
    // Convenience properties
    light: string;
    main: string;
    dark: string;
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
    // Convenience properties
    light: string;
    main: string;
    dark: string;
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
    default: string;
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
    light: '#d1fae5',
    main: '#10b981',
    dark: '#047857',
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
    light: '#ccfbf1',
    main: '#14b8a6',
    dark: '#0f766e',
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
    secondary: '#faf8f3', // Almost white with subtle cream hint
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
    default: '#e5e7eb',
  },

  surface: {
    primary: '#ffffff',
    secondary: '#faf8f3',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

// Option 2: Fall Season - Warm pumpkin orange with autumn vibes
export const fallTheme: ThemeColors = {
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main pumpkin orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    light: '#ffedd5',
    main: '#f97316',
    dark: '#c2410c',
  },

  secondary: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308', // Warm yellow
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    light: '#fef9c3',
    main: '#eab308',
    dark: '#a16207',
  },

  gray: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },

  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#047857',
  },

  warning: {
    light: '#fef3e0',
    main: '#fb923c',
    dark: '#ea580c',
  },

  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#dc2626',
  },

  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1d4ed8',
  },

  background: {
    primary: '#ffffff',
    secondary: '#fffbf5', // Very light warm cream
    tertiary: '#fff7ed', // Light orange tint
    white: '#ffffff',
  },

  text: {
    primary: '#1c1917',
    secondary: '#57534e',
    tertiary: '#78716c',
    disabled: '#a8a29e',
    inverse: '#ffffff',
  },

  border: {
    light: '#f5f5f4',
    main: '#e7e5e4',
    dark: '#d6d3d1',
    focus: '#f97316',
    default: '#e7e5e4',
  },

  surface: {
    primary: '#ffffff',
    secondary: '#fffbf5',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

// Option 3: Ocean Blue - Calming blue theme with serene vibes
export const oceanTheme: ThemeColors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main ocean blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1d4ed8',
  },

  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Sky blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    light: '#e0f2fe',
    main: '#0ea5e9',
    dark: '#0369a1',
  },

  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#047857',
  },

  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#d97706',
  },

  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#dc2626',
  },

  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1d4ed8',
  },

  background: {
    primary: '#ffffff',
    secondary: '#f8fafc', // Very light blue-gray
    tertiary: '#eff6ff', // Light blue tint
    white: '#ffffff',
  },

  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    disabled: '#94a3b8',
    inverse: '#ffffff',
  },

  border: {
    light: '#f1f5f9',
    main: '#e2e8f0',
    dark: '#cbd5e1',
    focus: '#3b82f6',
    default: '#e2e8f0',
  },

  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
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
  fall: {
    name: 'Fall Season',
    description: 'Warm pumpkin orange with cozy autumn vibes',
    accentColor: '#f97316',
  },
  ocean: {
    name: 'Ocean Blue',
    description: 'Calming ocean blue with serene, peaceful vibes',
    accentColor: '#3b82f6',
  },
};

// Get theme colors by variant
export function getThemeColors(variant: ThemeVariant): ThemeColors {
  switch (variant) {
    case 'fresh':
      return freshTheme;
    case 'fall':
      return fallTheme;
    case 'ocean':
      return oceanTheme;
    default:
      return freshTheme;
  }
}
