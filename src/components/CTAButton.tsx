import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';

interface CTAButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  loadingText?: string;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export function CTAButton({
  onPress,
  disabled = false,
  loading = false,
  icon,
  text,
  loadingText = 'Loading...',
  variant = 'primary',
  fullWidth = true,
}: CTAButtonProps) {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        (disabled || loading) && styles.disabledButton,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color={theme.colors.text.inverse} />
          <Text style={styles.buttonText}>{loadingText}</Text>
        </>
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={theme.colors.text.inverse} />}
          <Text style={styles.buttonText}>{text}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    fullWidth: {
      width: '100%',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary.main,
    },
    secondaryButton: {
      backgroundColor: theme.colors.background.secondary,
    },
    disabledButton: {
      backgroundColor: theme.colors.gray[400],
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text.inverse,
    },
  });
