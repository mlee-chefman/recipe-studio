import { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@store/store';
import { themeMetadata, ThemeVariant } from '@theme/variants';
import { useStyles } from '@hooks/useStyles';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';

export default function ThemeSettingsScreen() {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const { themeVariant, setThemeVariant } = useThemeStore();
  const styles = useStyles(createStyles);

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme.colors.background.primary,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: {
        fontWeight: theme.typography.fontWeight.semibold,
        fontSize: theme.typography.fontSize.lg,
      },
    });
  }, [navigation, theme]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Theme</Text>
          <Text style={styles.subtitle}>
            Select a color scheme that best fits your style
          </Text>
        </View>

        {/* Theme Options */}
        <View style={styles.themeContainer}>
          {(Object.keys(themeMetadata) as ThemeVariant[]).map((variant) => {
            const meta = themeMetadata[variant];
            const isSelected = themeVariant === variant;

            return (
              <TouchableOpacity
                key={variant}
                style={[
                  styles.themeOption,
                  isSelected && styles.themeOptionSelected,
                ]}
                onPress={() => setThemeVariant(variant)}
                activeOpacity={0.7}
              >
                {/* Color Preview Circle */}
                <View
                  style={[
                    styles.colorPreview,
                    { backgroundColor: meta.accentColor },
                  ]}
                >
                  {isSelected && (
                    <Feather name="check" size={24} color="white" />
                  )}
                </View>

                {/* Theme Info */}
                <View style={styles.themeInfo}>
                  <Text style={styles.themeName}>{meta.name}</Text>
                  <Text style={styles.themeDescription}>{meta.description}</Text>
                </View>

                {/* Selected Indicator */}
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Feather name="check-circle" size={24} color={meta.accentColor} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Feather name="info" size={20} color={styles.infoIcon.color} />
            <Text style={styles.infoText}>
              Your theme choice will be saved and applied across the entire app.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    padding: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing['2xl'],
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  themeContainer: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing['3xl'],
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    ...theme.shadows.md,
  },
  themeOptionSelected: {
    borderColor: theme.colors.primary[500],
    borderWidth: 3,
    ...theme.shadows.lg,
  },
  colorPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  themeDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  selectedBadge: {
    marginLeft: theme.spacing.sm,
  },
  infoSection: {
    marginTop: theme.spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
  },
  infoIcon: {
    color: theme.colors.primary[500],
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});
