import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, TextStyle, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface ThemedButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  children?: React.ReactNode;
  textStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  selected = false,
  children,
  textStyle,
  containerStyle,
  style,
  ...props
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    };

    // Size-based padding
    const sizeStyles = {
      small: { paddingHorizontal: 12, paddingVertical: 6 },
      medium: { paddingHorizontal: 16, paddingVertical: 12 },
      large: { paddingHorizontal: 20, paddingVertical: 16 },
    };

    // Variant-based colors
    let variantStyle: ViewStyle = {};

    if (selected) {
      // Selected state - always use primary green
      variantStyle = {
        backgroundColor: theme.colors.primary[500],
        borderColor: theme.colors.primary[500],
      };
    } else {
      switch (variant) {
        case 'primary':
          variantStyle = {
            backgroundColor: theme.colors.primary[500],
            borderColor: theme.colors.primary[500],
          };
          break;
        case 'secondary':
          variantStyle = {
            backgroundColor: 'transparent',
            borderColor: theme.colors.primary[500],
          };
          break;
        case 'tertiary':
          variantStyle = {
            backgroundColor: theme.colors.primary[50],
            borderColor: theme.colors.primary[50],
          };
          break;
        case 'ghost':
          variantStyle = {
            backgroundColor: theme.colors.gray[200],
            borderColor: theme.colors.gray[200],
          };
          break;
      }
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyle,
      ...containerStyle,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size-based font sizes
    const sizeStyles = {
      small: { fontSize: theme.typography.fontSize.sm },
      medium: { fontSize: theme.typography.fontSize.base },
      large: { fontSize: theme.typography.fontSize.lg },
    };

    // Variant-based text colors
    let textColor = theme.colors.text.primary;

    if (selected || variant === 'primary') {
      textColor = theme.colors.text.inverse;
    } else if (variant === 'secondary') {
      textColor = theme.colors.primary[500];
    } else if (variant === 'tertiary') {
      textColor = theme.colors.primary[600];
    } else if (variant === 'ghost') {
      textColor = theme.colors.text.secondary;
    }

    return {
      ...baseTextStyle,
      ...sizeStyles[size],
      color: textColor,
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      {...props}
    >
      {children || <Text style={getTextStyle()}>{title}</Text>}
    </TouchableOpacity>
  );
};

export default ThemedButton;