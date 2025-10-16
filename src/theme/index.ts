// Recipe Studio App Theme
// Clean, minimal health-focused design system

export const theme = {
  // === COLORS ===
  colors: {
    // Primary Green Palette (Main brand color #38A865)
    primary: {
      50: '#f0f9f3',   // Very light green background
      100: '#dcf2e3',  // Light green surface
      200: '#bce5ca',  // Soft green accent
      300: '#8fd5a6',  // Medium light green
      400: '#5cb97d',  // Medium green
      500: '#38A865',  // Main brand green
      600: '#2d8f54',  // Dark green
      700: '#257243',  // Darker green
      800: '#1f5a36',  // Very dark green
      900: '#1a4a2d',  // Deepest green
    },

    // Secondary Palette (Complementary mint blue)
    secondary: {
      50: '#f0fdfa',   // Very light mint
      100: '#ccfbf1',  // Light mint
      200: '#99f6e4',  // Soft mint
      300: '#5eead4',  // Medium mint
      400: '#2dd4bf',  // Mint accent
      500: '#14b8a6',  // Main mint
      600: '#0d9488',  // Dark mint
      700: '#0f766e',  // Darker mint
      800: '#115e59',  // Very dark mint
      900: '#134e4a',  // Deepest mint
    },

    // Neutral Grays (Professional and clean)
    gray: {
      50: '#f9fafb',   // Almost white
      100: '#f3f4f6',  // Very light gray
      200: '#e5e7eb',  // Light gray
      300: '#d1d5db',  // Medium light gray
      400: '#9ca3af',  // Medium gray
      500: '#6b7280',  // Gray
      600: '#4b5563',  // Dark gray
      700: '#374151',  // Darker gray
      800: '#1f2937',  // Very dark gray
      900: '#111827',  // Almost black
    },

    // Semantic Colors
    success: {
      light: '#dcf2e3',
      main: '#38A865',
      dark: '#257243',
    },

    warning: {
      light: '#fef3cd',
      main: '#f59e0b',
      dark: '#d97706',
    },

    error: {
      light: '#fecaca',
      main: '#ef4444',
      dark: '#dc2626',
    },

    info: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#1d4ed8',
    },

    // Background Colors
    background: {
      primary: '#ffffff',     // Pure white
      secondary: '#f9fafb',   // Very light gray
      tertiary: '#f0f9f3',    // Very light green
    },

    // Text Colors
    text: {
      primary: '#111827',     // Almost black
      secondary: '#4b5563',   // Dark gray
      tertiary: '#6b7280',    // Medium gray
      disabled: '#9ca3af',    // Light gray
      inverse: '#ffffff',     // White text
    },

    // Border Colors
    border: {
      light: '#f3f4f6',      // Very light gray
      main: '#e5e7eb',       // Light gray
      dark: '#d1d5db',       // Medium light gray
      focus: '#38A865',      // Green focus
    },

    // Surface Colors (for cards, modals, etc.)
    surface: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      elevated: '#ffffff',   // For modals/overlays
      overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
    },
  },

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
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
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
        backgroundColor: '#38A865',
        borderColor: '#38A865',
        color: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        fontWeight: '600',
      },
      secondary: {
        backgroundColor: 'transparent',
        borderColor: '#38A865',
        color: '#38A865',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
        fontWeight: '600',
      },
      tertiary: {
        backgroundColor: '#f0f9f3',
        borderColor: 'transparent',
        color: '#38A865',
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
        borderColor: '#38A865',
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

// Type definitions for TypeScript
export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
export type ThemeTypography = typeof theme.typography;

// Default export
export default theme;