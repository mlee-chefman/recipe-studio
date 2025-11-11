import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ToastProps {
  message: string;
  visible: boolean;
  onPress?: () => void;
  onHide?: () => void;
  duration?: number; // Duration in ms (default 3000)
}

export function Toast({ message, visible, onPress, onHide, duration = 3000 }: ToastProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        // Slide out
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Immediately hide
      translateY.setValue(-100);
    }
  }, [visible, duration, translateY, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Feather name="check-circle" size={20} color="#fff" />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        {onPress && (
          <Feather name="chevron-right" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 60, // Below status bar
      left: theme.spacing.md,
      right: theme.spacing.md,
      zIndex: 9999,
      elevation: 10,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.success.main,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      ...theme.shadows.lg,
    },
    message: {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      fontWeight: '600',
      color: '#fff',
    },
  });
