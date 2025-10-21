import { useMemo } from 'react';
import { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/**
 * Custom hook for creating theme-aware styles
 * Automatically handles theme changes and memoization
 *
 * @example
 * ```tsx
 * const Component = () => {
 *   const styles = useStyles(createStyles);
 *   return <View style={styles.container} />;
 * };
 *
 * const createStyles = (theme: Theme) => StyleSheet.create({
 *   container: {
 *     backgroundColor: theme.colors.background.primary,
 *   },
 * });
 * ```
 */
export function useStyles<T extends NamedStyles<T>>(
  styleFactory: (theme: Theme) => T
): T {
  const theme = useAppTheme();

  return useMemo(() => styleFactory(theme), [theme, styleFactory]);
}
