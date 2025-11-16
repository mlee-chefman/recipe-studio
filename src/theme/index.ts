// RecipeiQ App Theme
// Clean, minimal design system matching app icon

import { useMemo } from 'react';
import { getThemeColors, ThemeVariant } from './variants';
import { useThemeStore } from '@store/store';

// Static theme properties (non-color properties that don't change)
const staticTheme = {
  // === SPACING ===
  spacing: {
    // Base spacing unit (4px)
    xs: 4,    // 4px
    sm: 8,    // 8px
    md: 12,   // 12px
    lg: 16,   // 16px
    xl: 20,   // 20px
    '2xl': 24, // 24px
    '3xl': 32, // 32px
    '4xl': 40, // 40px
    '5xl': 48, // 48px
    '6xl': 64, // 64px
  },

  // === TYPOGRAPHY ===
  typography: {
    // Font Families
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },

    // Font Weights
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    // Font Sizes
    fontSize: {
      xs: 12,   // 12px - Small labels, captions
      sm: 14,   // 14px - Body text small, secondary info
      base: 16, // 16px - Body text, default
      lg: 18,   // 18px - Large body text
      xl: 20,   // 20px - Small headings
      '2xl': 24, // 24px - Medium headings
      '3xl': 30, // 30px - Large headings
      '4xl': 36, // 36px - Extra large headings
    },

    // Line Heights
    lineHeight: {
      tight: 20,
      normal: 22,
      relaxed: 24,
    },

    // Text Styles (ready-to-use combinations)
    styles: {
      // Headings
      h1: {
        fontSize: 30,
        fontWeight: '700',
        lineHeight: 1.2,
        color: '#111827',
      },
      h2: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 1.2,
        color: '#111827',
      },
      h3: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 1.3,
        color: '#111827',
      },
      h4: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 1.3,
        color: '#374151',
      },

      // Body Text
      body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 1.4,
        color: '#111827',
      },
      bodySmall: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 1.4,
        color: '#4b5563',
      },
      caption: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 1.4,
        color: '#6b7280',
      },

      // Interactive Elements
      button: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 1.2,
      },
      buttonSmall: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 1.2,
      },
    },
  },

  // === BORDER RADIUS ===
  borderRadius: {
    none: 0,
    sm: 4,     // Small elements
    md: 6,     // Default
    lg: 8,     // Cards, buttons
    xl: 12,    // Large cards
    '2xl': 16, // Modals
    full: 9999, // Circular
  },

  // === SHADOWS ===
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 8,
    },
  },

  // === COMPONENT STYLES ===
  components: {
    // Button Styles
    button: {
      primary: {
        backgroundColor: '#02533a',
        borderColor: '#02533a',
        color: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        fontWeight: '600',
      },
      secondary: {
        backgroundColor: 'transparent',
        borderColor: '#02533a',
        color: '#02533a',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
        fontWeight: '600',
      },
      tertiary: {
        backgroundColor: '#e6f2ee',
        borderColor: 'transparent',
        color: '#02533a',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        fontWeight: '500',
      },
    },

    // Input Styles
    input: {
      default: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
      },
      focused: {
        borderColor: '#02533a',
        borderWidth: 2,
      },
      error: {
        borderColor: '#ef4444',
        borderWidth: 1,
      },
    },

    // Card Styles
    card: {
      default: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
      },
      elevated: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        padding: 16,
      },
    },
  },

  // === DIMENSIONS ===
  dimensions: {
    // Common component heights
    buttonHeight: {
      small: 32,
      medium: 40,
      large: 48,
    },
    inputHeight: {
      small: 32,
      medium: 40,
      large: 48,
    },
    headerHeight: 60,
    tabBarHeight: 60,
  },

  // === OPACITY ===
  opacity: {
    disabled: 0.5,
    overlay: 0.5,
    pressed: 0.8,
  },
};

// Legacy theme export (uses 'fresh' theme colors by default for backward compatibility)
export const theme = {
  ...staticTheme,
  colors: getThemeColors('fresh'),
};

/**
 * Hook to get the current app theme with dynamic colors based on user selection
 * Use this in components that need to respond to theme changes
 */
export function useAppTheme() {
  const themeVariant = useThemeStore((state) => state.themeVariant);

  return useMemo(() => ({
    ...staticTheme,
    colors: getThemeColors(themeVariant),
  }), [themeVariant]);
}

// Type definitions for TypeScript
export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
export type ThemeTypography = typeof theme.typography;

// Default export
export default theme;