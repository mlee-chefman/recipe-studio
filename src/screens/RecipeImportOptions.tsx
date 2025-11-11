import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';

export default function RecipeImportOptionsScreen() {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const navigation = useNavigation();

  // Set header options with proper back button color
  React.useLayoutEffect(() => {
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

  const handleScanRecipe = () => {
    // @ts-ignore
    navigation.navigate('RecipeOCRImport');
  };

  const handleTextImport = () => {
    // @ts-ignore
    navigation.navigate('RecipeTextImport');
  };

  const handlePDFImport = () => {
    // @ts-ignore
    navigation.navigate('RecipePDFImport');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Import Recipe</Text>
        <Text style={styles.subtitle}>Choose how you'd like to import your recipe</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {/* Scan Recipe Option */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleScanRecipe}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: theme.colors.success.light }]}>
            <Text style={styles.optionEmoji}>📸</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Scan from Photo</Text>
            <Text style={styles.optionDescription}>
              Take a photo or upload an image to extract recipe text
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color={theme.colors.text.tertiary} />
        </TouchableOpacity>

        {/* Text Import Option */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleTextImport}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: theme.colors.info.light }]}>
            <Text style={styles.optionEmoji}>📝</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Paste from Text</Text>
            <Text style={styles.optionDescription}>
              Paste recipe text from Notes, Messages, or clipboard
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color={theme.colors.text.tertiary} />
        </TouchableOpacity>

        {/* PDF Import Option */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handlePDFImport}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: theme.colors.error.light }]}>
            <Text style={styles.optionEmoji}>📄</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Import from PDF</Text>
            <Text style={styles.optionDescription}>
              Extract recipes from PDF cookbooks or documents
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color={theme.colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          All import methods use AI to extract and format recipe details automatically
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  optionsContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    ...theme.shadows.sm,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.info.dark,
    lineHeight: 20,
  },
});
