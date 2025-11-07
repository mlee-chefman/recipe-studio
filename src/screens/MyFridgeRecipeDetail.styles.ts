import { StyleSheet } from 'react-native';
import { Theme } from '@theme/index';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollView: {
      flex: 1,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    editButton: {
      padding: theme.spacing.sm,
    },

    // Recipe Image
    recipeImage: {
      width: '100%',
      height: 240,
      backgroundColor: theme.colors.gray[200],
    },

    // Title Section
    titleSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginRight: theme.spacing.md,
    },
    matchBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      minWidth: 60,
      alignItems: 'center',
    },
    matchText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '700',
      color: '#fff',
    },
    aiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.primary.light,
      borderRadius: theme.borderRadius.full,
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    aiBadgeText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
      color: theme.colors.primary.main,
    },
    description: {
      fontSize: theme.typography.fontSize.base,
      lineHeight: 22,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.sm,
    },

    // Recipe Info
    infoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.background.secondary,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border.default,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    infoText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: '500',
    },

    // ChefIQ Appliance Section
    chefiqSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.primary.light + '20',
      borderBottomWidth: 1,
      borderColor: theme.colors.primary.light,
    },
    chefiqSectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '600',
      color: theme.colors.primary.main,
    },
    applianceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.primary.light,
    },
    applianceImage: {
      width: 48,
      height: 48,
      marginRight: theme.spacing.md,
    },
    applianceInfo: {
      flex: 1,
    },
    applianceName: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    applianceHint: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
    },
    probeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.warning.light,
      borderRadius: theme.borderRadius.md,
    },
    probeText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '600',
      color: theme.colors.warning.dark,
    },

    // Missing Ingredients Section
    missingSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.error.light + '20',
      borderBottomWidth: 1,
      borderColor: theme.colors.error.light,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    missingSectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '600',
      color: theme.colors.error.main,
    },
    missingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    missingText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.error.main,
    },
    addMissingToCartButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.success.main,
      borderRadius: theme.borderRadius.lg,
      marginTop: theme.spacing.md,
      ...theme.shadows.md,
    },
    addMissingToCartText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: '600',
      color: '#fff',
    },

    // Substitutions Section
    substitutionsSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.background.secondary,
      borderBottomWidth: 1,
      borderColor: theme.colors.border.default,
    },
    substitutionsSectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '600',
      color: theme.colors.primary.main,
    },
    substitutionsHint: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.md,
      fontStyle: 'italic',
    },
    substitutionCard: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    substitutionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    substitutionMissing: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: '600',
      color: theme.colors.text.primary,
      flex: 1,
    },
    appliedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      backgroundColor: theme.colors.success.light + '30',
      borderRadius: theme.borderRadius.md,
    },
    appliedText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '600',
      color: theme.colors.success.main,
    },
    substitutionLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.sm,
    },
    substitutesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    substituteChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    substituteChipActive: {
      backgroundColor: theme.colors.primary.light,
      borderColor: theme.colors.primary.main,
    },
    substituteText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    substituteTextActive: {
      color: theme.colors.primary.main,
      fontWeight: '600',
    },

    // Common Section Styles
    section: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },

    // Ingredients
    ingredientItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    ingredientText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      lineHeight: 22,
    },
    ingredientTextModified: {
      color: theme.colors.primary.main,
      fontWeight: '600',
    },

    // Instructions
    stepContainer: {
      marginBottom: theme.spacing.md,
    },
    stepItem: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumberText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: '700',
      color: '#fff',
    },
    stepContent: {
      flex: 1,
    },
    stepText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      lineHeight: 24,
      paddingTop: 4,
    },
    stepImageContainer: {
      marginTop: theme.spacing.sm,
    },

    // Cooking Actions
    cookingActionCard: {
      marginTop: theme.spacing.sm,
      marginLeft: 44, // Offset to align with step text (32px step number + 12px gap)
      backgroundColor: theme.colors.primary.light + '20',
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary.light,
      padding: theme.spacing.md,
    },
    cookingActionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cookingActionIcon: {
      fontSize: 24,
      marginRight: theme.spacing.md,
    },
    cookingActionInfo: {
      flex: 1,
    },
    cookingActionMethod: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
      color: theme.colors.primary.main,
      marginBottom: 2,
    },
    cookingActionParams: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    cookingActionAppliance: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      fontStyle: 'italic',
    },

    // Tags
    tagsSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    tag: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    tagText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: '500',
    },

    // Save Button
    saveButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
      ...theme.shadows.lg,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: theme.colors.primary.main,
    },
    saveButtonDisabled: {
      backgroundColor: theme.colors.gray[400],
    },
    saveButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '700',
      color: '#fff',
    },
  });
