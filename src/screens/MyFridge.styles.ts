import { StyleSheet } from 'react-native';
import { Theme } from '@theme/index';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Preferences Section
    preferencesContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
      backgroundColor: theme.colors.background.secondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
    },
    preferencesToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    preferencesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    preferencesTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    preferencesContent: {
      paddingBottom: theme.spacing.md,
    },
    preferenceButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md - 2,
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    preferenceButtonLast: {
      marginBottom: 0,
    },
    preferenceLabel: {
      fontSize: 11,
      color: theme.colors.text.secondary,
    },
    preferenceValue: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '500',
      color: theme.colors.text.primary,
    },

    // Main Content
    mainContent: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    headerContainer: {
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: theme.typography.fontSize.sm + 1,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    clearAllButton: {
      marginTop: theme.spacing.sm,
    },
    clearAllText: {
      fontSize: theme.typography.fontSize.sm + 1,
      color: theme.colors.primary.main,
      fontWeight: '600',
    },

    // Ingredient Grid
    ingredientGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'flex-start',
    },
    ingredientBox: {
      width: '31.5%',
      aspectRatio: 1,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 2,
      borderColor: theme.colors.primary.light,
      padding: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      position: 'relative',
    },
    ingredientRemoveButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.xl,
      padding: 2,
    },
    ingredientImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    ingredientName: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '600',
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    addIngredientBox: {
      width: '31.5%',
      aspectRatio: 1,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 2,
      borderColor: theme.colors.border.default,
      borderStyle: 'dashed',
      padding: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    addIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },

    // Search Modal
    searchModal: {
      position: 'absolute',
      top: 0,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      padding: theme.spacing.lg,
      ...theme.shadows.lg,
      zIndex: 100,
    },
    searchHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    searchTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md - 2,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      marginBottom: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      marginLeft: theme.spacing.sm,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
    },
    searchResults: {
      maxHeight: 200,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
      gap: theme.spacing.md,
    },
    searchResultImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    searchResultText: {
      fontSize: theme.typography.fontSize.base - 1,
      color: theme.colors.text.primary,
      flex: 1,
    },

    // Error Message
    errorContainer: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.error.light,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      marginLeft: theme.spacing.sm,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.error.main,
      flex: 1,
    },

    // CTA Button
    ctaContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    ctaButton: {
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.borderRadius.xl,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
    },
    ctaButtonEnabled: {
      backgroundColor: theme.colors.primary.main,
    },
    ctaButtonDisabled: {
      backgroundColor: theme.colors.gray[400],
    },
    ctaButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '700',
      color: theme.colors.text.inverse,
    },
    ctaSubtext: {
      fontSize: 11,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: 6,
    },
    ctaSpacer: {
      height: theme.spacing.md,
    },

    // Mode Toggle Styles
    modeToggleContainer: {
      flexDirection: 'row' as const,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
      padding: 4,
      marginBottom: theme.spacing.md,
    },
    modeToggleButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center' as const,
    },
    modeToggleButtonActive: {
      backgroundColor: theme.colors.primary.main,
    },
    modeToggleButtonDisabled: {
      opacity: 0.5,
    },
    modeToggleText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600' as const,
      color: theme.colors.text.secondary,
    },
    modeToggleTextActive: {
      color: '#fff',
    },
    modeToggleTextDisabled: {
      color: theme.colors.text.secondary,
      opacity: 0.5,
    },

    // Recipe Card Styles
    recipeCardContainer: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
    },
    recipeCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    recipeCardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    recipeCardHeaderText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
      color: theme.colors.primary.main,
    },
    refreshButton: {
      padding: theme.spacing.xs,
    },
    recipeCard: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      ...theme.shadows.sm,
    },
    recipeCardImage: {
      width: '100%',
      height: 180,
      backgroundColor: theme.colors.gray[200],
    },
    recipeCardContent: {
      padding: theme.spacing.md,
    },
    recipeCardTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    recipeCardDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      lineHeight: 20,
      marginBottom: theme.spacing.sm,
    },
    recipeCardMeta: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    recipeCardMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    recipeCardMetaText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
    },
    recipeCardAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
    },
    recipeCardActionText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
      color: theme.colors.primary.main,
    },
  });
