import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import { useAppTheme } from '@theme/index';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { Recipe } from '~/types/recipe';
import { formatCookTime } from '@utils/timeFormatter';

interface RecipeResultCardProps {
  recipe: ScrapedRecipe | Recipe;
  matchPercentage?: number;
  missingIngredients?: string[];
  substitutions?: { missing: string; substitutes: string[] }[];
  onPress: () => void;
  source: 'ai' | 'existing';
  isRegenerating?: boolean;
}

export function RecipeResultCard({
  recipe,
  matchPercentage = 100,
  missingIngredients = [],
  substitutions = [],
  onPress,
  source,
  isRegenerating = false,
}: RecipeResultCardProps) {
  const styles = useStyles(createStyles);
  const theme = useAppTheme();

  const hasSubstitutions = substitutions.length > 0;
  const hasMissingIngredients = missingIngredients.length > 0;

  // Get match percentage color
  const getMatchColor = () => {
    if (matchPercentage >= 80) return theme.colors.success.main;
    if (matchPercentage >= 60) return theme.colors.warning.main;
    return theme.colors.error.main;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={isRegenerating}>
      {/* Recipe Image with Loading Overlay */}
      <View style={styles.imageContainer}>
        {recipe.image && (
          <Image source={{ uri: recipe.image }} style={styles.image} resizeMode="cover" />
        )}

        {/* Loading Overlay */}
        {isRegenerating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loadingText}>Regenerating...</Text>
          </View>
        )}
      </View>

      {/* Header with match percentage */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          {source === 'ai' && (
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color={theme.colors.primary.main} />
              <Text style={styles.aiBadgeText}>AI Generated</Text>
            </View>
          )}
        </View>

        <View style={[styles.matchBadge, { backgroundColor: getMatchColor() }]}>
          <Text style={styles.matchText}>{matchPercentage}%</Text>
        </View>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Description */}
        {recipe.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}

        {/* Recipe Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>
              {formatCookTime(('prepTime' in recipe ? recipe.prepTime : 0) + recipe.cookTime)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="restaurant-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>{recipe.servings} servings</Text>
          </View>
          {recipe.category && (
            <View style={styles.infoItem}>
              <Ionicons name="pricetag-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.infoText}>{recipe.category}</Text>
            </View>
          )}
        </View>

        {/* Missing Ingredients */}
        {hasMissingIngredients && (
          <View style={styles.missingSection}>
            <Text style={styles.missingSectionTitle}>
              <Ionicons name="alert-circle-outline" size={14} /> Missing:{' '}
            </Text>
            <Text style={styles.missingText} numberOfLines={2}>
              {missingIngredients.slice(0, 3).join(', ')}
              {missingIngredients.length > 3 && ` +${missingIngredients.length - 3} more`}
            </Text>
          </View>
        )}

        {/* Substitutions */}
        {hasSubstitutions && (
          <View style={styles.substitutionsSection}>
            <Text style={styles.substitutionsSectionTitle}>
              <Ionicons name="swap-horizontal-outline" size={14} /> Substitutions Available
            </Text>
            {substitutions.slice(0, 2).map((sub, index) => (
              <Text key={index} style={styles.substitutionText} numberOfLines={1}>
                • {sub.missing} → {sub.substitutes.slice(0, 2).join(' or ')}
              </Text>
            ))}
            {substitutions.length > 2 && (
              <Text style={styles.moreSubstitutions}>+{substitutions.length - 2} more</Text>
            )}
          </View>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {recipe.tags.length > 3 && (
              <Text style={styles.moreTags}>+{recipe.tags.length - 3}</Text>
            )}
          </View>
        )}

        {/* Action Hint */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Tap to view full recipe</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.xl,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      overflow: 'hidden',
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: 200,
    },
    image: {
      width: '100%',
      height: 200,
      backgroundColor: theme.colors.background.tertiary,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    loadingText: {
      color: '#fff',
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold as any,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
    contentContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    titleContainer: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold as any,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    aiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary.light,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.md,
      alignSelf: 'flex-start',
      marginTop: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
    aiBadgeText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.primary.main,
      fontWeight: theme.typography.fontWeight.semibold as any,
    },
    matchBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius['2xl'],
    },
    matchText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold as any,
      color: '#fff',
    },
    description: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.md,
      lineHeight: theme.typography.lineHeight.tight,
    },
    infoRow: {
      flexDirection: 'row',
      gap: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    infoText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
    },
    missingSection: {
      backgroundColor: theme.colors.error.light,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    missingSectionTitle: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold as any,
      color: theme.colors.error.main,
      marginBottom: theme.spacing.xs,
    },
    missingText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error.main,
    },
    substitutionsSection: {
      backgroundColor: theme.colors.primary.light,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    substitutionsSectionTitle: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold as any,
      color: theme.colors.primary.main,
      marginBottom: theme.spacing.xs,
    },
    substitutionText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.primary.main,
      marginTop: 2,
    },
    moreSubstitutions: {
      fontSize: 11,
      color: theme.colors.primary.main,
      fontStyle: 'italic',
      marginTop: 2,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    tag: {
      backgroundColor: theme.colors.background.primary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    tagText: {
      fontSize: 11,
      color: theme.colors.text.secondary,
    },
    moreTags: {
      fontSize: 11,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
      alignSelf: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
    },
    footerText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
    },
  });
