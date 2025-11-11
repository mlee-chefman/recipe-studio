import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';
import BaseModal from './BaseModal';

interface RemainingGenerations {
  daily: number;
  dailyLimit: number;
}

interface CreateRecipeOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectWebImport: () => void;
  onSelectImportRecipe: () => void;
  onSelectStartFromScratch: () => void;
  // AI Generation props
  aiDescription: string;
  onChangeAIDescription: (text: string) => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
  remainingGenerations: RemainingGenerations | null;
}

export default function CreateRecipeOptionsModal({
  visible,
  onClose,
  onSelectWebImport,
  onSelectImportRecipe,
  onSelectStartFromScratch,
  aiDescription,
  onChangeAIDescription,
  onGenerateAI,
  isGenerating,
  remainingGenerations,
}: CreateRecipeOptionsModalProps) {
  const styles = useStyles(createStyles);
  const [showAIInput, setShowAIInput] = useState(false);

  // Reset to main view when modal closes
  useEffect(() => {
    if (!visible) {
      setShowAIInput(false);
    }
  }, [visible]);

  const handleAIGenerateClick = () => {
    setShowAIInput(true);
  };

  const handleBackToOptions = () => {
    setShowAIInput(false);
    onChangeAIDescription('');
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      showDragIndicator={true}
      maxHeight={showAIInput ? "75%" : undefined}
      avoidKeyboard={showAIInput}
    >
      {!showAIInput ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Recipe</Text>
            <Text style={styles.subtitle}>Choose how you'd like to start</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* AI Generate Option - PRIMARY */}
            <TouchableOpacity
              style={[styles.optionButton, styles.primaryOption]}
              onPress={handleAIGenerateClick}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.primary[500] }]}>
                <Text style={styles.optionEmoji}>✨</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Generate with AI</Text>
                <Text style={styles.optionDescription}>
                  Describe your recipe idea and let AI create it for you
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* Website Import Option */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={onSelectWebImport}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.primary[100] }]}>
                <Text style={styles.optionEmoji}>🌐</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Import from Website</Text>
                <Text style={styles.optionDescription}>
                  Browse and import recipes from your favorite cooking websites
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* Import Recipe Option - Consolidated */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={onSelectImportRecipe}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.success.light }]}>
                <Text style={styles.optionEmoji}>📋</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Import Recipe</Text>
                <Text style={styles.optionDescription}>
                  Scan photo, paste text, or import from PDF
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* Start from Scratch Option */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={onSelectStartFromScratch}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.gray[200] }]}>
                <Text style={styles.optionEmoji}>✏️</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Start from Scratch</Text>
                <Text style={styles.optionDescription}>
                  Create a new recipe manually with your own ingredients and steps
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* AI Generation View */}
          <View style={styles.aiContainer}>
            {/* Header with Back Button */}
            <View style={styles.aiHeader}>
              <TouchableOpacity onPress={handleBackToOptions} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <View style={styles.aiHeaderContent}>
                <MaterialCommunityIcons name="robot-excited" size={28} color={theme.colors.primary[500]} />
                <Text style={styles.aiTitle}>Generate with AI</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.aiDescription}>
              Describe your recipe idea and AI will create a complete recipe for you
            </Text>

            {/* Remaining Generations */}
            {remainingGenerations && (
              <View style={styles.generationsCard}>
                <MaterialCommunityIcons name="lightning-bolt" size={18} color={theme.colors.primary[500]} style={{ marginRight: 8 }} />
                <Text style={styles.generationsText}>
                  {remainingGenerations.daily} of {remainingGenerations.dailyLimit} generations remaining today
                </Text>
              </View>
            )}

            {/* Text Input */}
            <TextInput
              style={styles.aiInput}
              placeholder='e.g., "spicy chicken curry with coconut milk, ready in 30 minutes"'
              placeholderTextColor={theme.colors.text.tertiary}
              value={aiDescription}
              onChangeText={onChangeAIDescription}
              editable={!isGenerating}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
            />

            {/* Hint */}
            <Text style={styles.aiHint}>
              Be specific! Include ingredients, cooking methods, or dietary preferences.
            </Text>

            {/* Generate Button */}
            <TouchableOpacity
              style={[styles.generateButton, (isGenerating || !aiDescription.trim()) && styles.generateButtonDisabled]}
              onPress={onGenerateAI}
              disabled={isGenerating || !aiDescription.trim()}
              activeOpacity={0.8}
            >
              {isGenerating ? (
                <View style={styles.generatingContent}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.generateButtonText}>Generating...</Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="auto-fix" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.generateButtonText}>Generate Recipe</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </BaseModal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  header: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  optionsContainer: {
    padding: theme.spacing.lg,
    paddingBottom: Platform.OS === 'android' ? 40 : theme.spacing.xl,
    gap: theme.spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  primaryOption: {
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
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
  chevron: {
    fontSize: 28,
    color: theme.colors.gray[400],
    marginLeft: theme.spacing.sm,
  },
  // AI Generation View Styles
  aiContainer: {
    padding: theme.spacing.xl,
    paddingBottom: Platform.OS === 'android' ? 40 : theme.spacing.xl,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
    marginLeft: -theme.spacing.sm,
  },
  aiHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  aiTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  aiDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  generationsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  generationsText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  aiInput: {
    backgroundColor: theme.colors.surface.primary,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    minHeight: 120,
    marginBottom: theme.spacing.sm,
  },
  aiHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.lg,
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: 'white',
  },
  generatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
});
