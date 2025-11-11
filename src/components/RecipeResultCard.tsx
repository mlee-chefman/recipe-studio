import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import { useAppTheme } from '@theme/index';
import { ScrapedRecipe } from '@utils/recipeScraper';
import { Recipe } from '~/types/recipe';

interface RecipeResultCardProps {
  recipe: ScrapedRecipe | Recipe;
  matchPercentage?: number;
  missingIngredients?: string[];
  substitutions?: Array<{ missing: string; substitutes: string[] }>;
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
              {('prepTime' in recipe ? recipe.prepTime : 0) + recipe.cookTime} min
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
      borderRadius: 12,
      marginBottom: 12,
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
      gap: 12,
    },
    loadingText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    titleContainer: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    aiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary.light,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
      gap: 4,
    },
    aiBadgeText: {
      fontSize: 11,
      color: theme.colors.primary.main,
      fontWeight: '600',
    },
    matchBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    matchText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
    },
    description: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    infoRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 12,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    infoText: {
      fontSize: 13,
      color: theme.colors.text.secondary,
    },
    missingSection: {
      backgroundColor: theme.colors.error.light,
      padding: 8,
      borderRadius: 6,
      marginBottom: 8,
    },
    missingSectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.error.main,
      marginBottom: 4,
    },
    missingText: {
      fontSize: 12,
      color: theme.colors.error.main,
    },
    substitutionsSection: {
      backgroundColor: theme.colors.primary.light,
      padding: 8,
      borderRadius: 6,
      marginBottom: 8,
    },
    substitutionsSectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary.main,
      marginBottom: 4,
    },
    substitutionText: {
      fontSize: 11,
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
      gap: 6,
      marginBottom: 8,
    },
    tag: {
      backgroundColor: theme.colors.background.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
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
      marginTop: 4,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
    },
    footerText: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
    },
  });
