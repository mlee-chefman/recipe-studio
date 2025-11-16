import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';
import BaseModal from './BaseModal';

interface RemainingGenerations {
  daily: number;
  dailyLimit: number;
}

interface AIAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  aiDescription: string;
  onChangeDescription: (text: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  remainingGenerations: RemainingGenerations | null;
  enhanceMode?: boolean; // If true, shows "enhance" UI instead of "generate from scratch"
  recipeContext?: {
    title?: string;
    ingredients?: string[];
    steps?: string[];
  };
}

export function AIAssistantModal({
  visible,
  onClose,
  aiDescription,
  onChangeDescription,
  onGenerate,
  isGenerating,
  remainingGenerations,
  enhanceMode = false,
  recipeContext,
}: AIAssistantModalProps) {
  const styles = useStyles(createStyles);

  const hasRecipeContent = recipeContext && (
    (recipeContext.title && recipeContext.title.trim() !== '') ||
    (recipeContext.ingredients && recipeContext.ingredients.some(i => i.trim() !== '')) ||
    (recipeContext.steps && recipeContext.steps.some(s => s.trim() !== ''))
  );

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      showDragIndicator={true}
      maxHeight="100%"
      avoidKeyboard={true}
      hasPaddingBottom={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name={enhanceMode ? "auto-fix" : "robot-excited"}
            size={28}
            color={theme.colors.primary[500]}
            style={styles.headerIcon}
          />
          <Text style={styles.title}>
            {enhanceMode ? 'AI Recipe Enhancer' : 'AI Recipe Assistant'}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          {enhanceMode
            ? hasRecipeContent
              ? 'Tell AI how to improve your recipe. You can ask to simplify, add steps, change cooking methods, make it healthier, and more!'
              : 'Stuck or don\'t know where to start? Ask AI anything! Draft a recipe, get suggestions, or brainstorm ideas.'
            : 'Don\'t know where to start? Describe what you want to cook and let AI generate a complete recipe for you!'}
        </Text>

        {/* Remaining generations */}
        {remainingGenerations && (
          <View style={styles.generationsCard}>
            <Text style={styles.generationsText}>
              ✨ {remainingGenerations.daily} of {remainingGenerations.dailyLimit} generations remaining today
            </Text>
          </View>
        )}

        {/* Input */}
        <TextInput
          style={styles.input}
          placeholder={enhanceMode
            ? hasRecipeContent
              ? 'e.g., "make this vegetarian" or "add grilling to step 3"'
              : 'e.g., "quick chicken dinner for 4" or "what can I make with rice and chicken?"'
            : 'e.g., "simple pork chop" or "easy chicken pasta"'}
          placeholderTextColor={theme.colors.gray[400]}
          value={aiDescription}
          onChangeText={onChangeDescription}
          editable={!isGenerating}
          multiline
          autoFocus
        />

        {/* Generate/Enhance Button */}
        <TouchableOpacity
          onPress={onGenerate}
          disabled={isGenerating || !aiDescription.trim()}
          style={[
            styles.generateButton,
            (isGenerating || !aiDescription.trim()) && styles.generateButtonDisabled
          ]}
        >
          {isGenerating ? (
            <View style={styles.generatingContent}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.generateButtonText}>
                {enhanceMode
                  ? hasRecipeContent ? 'Enhancing Recipe...' : 'Generating Draft...'
                  : 'Generating Recipe...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>
              {enhanceMode
                ? hasRecipeContent ? 'Enhance Recipe' : 'Generate Draft'
                : 'Generate Recipe'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
      backgroundColor: theme.colors.background.primary,
      paddingBottom: theme.spacing['6xl'],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    headerIcon: {
      marginRight: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold as any,
      color: theme.colors.primary[700],
    },
    description: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.md,
      lineHeight: theme.typography.lineHeight.normal,
    },
    generationsCard: {
      backgroundColor: theme.colors.primary[50],
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary[200],
    },
    generationsText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary[700],
      fontWeight: theme.typography.fontWeight.semibold as any,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.primary[300],
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSize.base,
      backgroundColor: theme.colors.surface.primary,
      marginBottom: theme.spacing.lg,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    generateButton: {
      backgroundColor: theme.colors.primary[500],
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing['2xl'],
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      ...theme.shadows.lg,
    },
    generateButtonDisabled: {
      backgroundColor: theme.colors.gray[300],
      shadowOpacity: 0,
    },
    generatingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    generateButtonText: {
      color: 'white',
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold as any,
    },
  });
