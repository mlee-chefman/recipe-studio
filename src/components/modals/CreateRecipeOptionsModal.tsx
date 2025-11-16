import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, ActivityIndicator, ScrollView } from 'react-native';
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

  // Header Section
  const headerSection = useMemo(() => (
    <View style={styles.header}>
      <Text style={styles.title}>Create Recipe</Text>
      <Text style={styles.subtitle}>Choose how you'd like to start</Text>
    </View>
  ), [styles]);

  // Generation Counter Badge
  const generationCounter = useMemo(() => {
    if (!remainingGenerations) return null;

    return (
      <View style={styles.compactGenerationsCounter}>
        <MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.colors.primary[500]} />
        <Text style={styles.compactGenerationsText}>
          {remainingGenerations.daily}/{remainingGenerations.dailyLimit}
        </Text>
      </View>
    );
  }, [remainingGenerations, styles]);

  // AI Generation Section
  const aiSection = useMemo(() => {
    const maxLength = 200;
    const charCount = aiDescription.length;
    const isNearLimit = charCount > maxLength * 0.8; // 80% threshold

    return (
      <View style={styles.aiCompactContainer}>
        <View style={styles.aiCompactHeader}>
          <MaterialCommunityIcons name="robot-excited" size={20} color={theme.colors.primary[500]} />
          <Text style={styles.aiCompactTitle}>Generate with AI</Text>
          {generationCounter}
        </View>

        <Text style={styles.aiHint}>
          Describe what you want to cook and AI will create a recipe draft
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.aiCompactInput}
            placeholder='e.g., "spicy Thai chicken curry" or "healthy veggie lasagna for 6"'
            placeholderTextColor={theme.colors.text.tertiary}
            value={aiDescription}
            onChangeText={onChangeAIDescription}
            editable={!isGenerating}
            multiline
            maxLength={maxLength}
            textAlignVertical="top"
          />
          {aiDescription.length > 0 && (
            <Text style={[
              styles.charCounter,
              isNearLimit && styles.charCounterWarning
            ]}>
              {charCount}/{maxLength}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.compactGenerateButton, (isGenerating || !aiDescription.trim()) && styles.compactGenerateButtonDisabled]}
          onPress={onGenerateAI}
          disabled={isGenerating || !aiDescription.trim()}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <View style={styles.generatingContent}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.compactGenerateButtonText}>Generating...</Text>
            </View>
          ) : (
            <>
              <MaterialCommunityIcons name="auto-fix" size={18} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.compactGenerateButtonText}>Generate Draft</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [
    styles,
    generationCounter,
    aiDescription,
    onChangeAIDescription,
    isGenerating,
    onGenerateAI,
  ]);

  // Divider Section
  const divider = useMemo(() => (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or</Text>
      <View style={styles.dividerLine} />
    </View>
  ), [styles]);

  // Option Button Renderer
  const renderOption = useMemo(() => {
    const createOption = (
      emoji: string,
      title: string,
      backgroundColor: string,
      onPress: () => void
    ) => (
      <TouchableOpacity
        style={styles.optionButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.optionIcon, { backgroundColor }]}>
          <Text style={styles.optionEmoji}>{emoji}</Text>
        </View>
        <Text style={styles.optionTitle}>{title}</Text>
      </TouchableOpacity>
    );

    return {
      websiteImport: createOption(
        '🌐',
        'Website',
        theme.colors.primary[100],
        onSelectWebImport
      ),
      importRecipe: createOption(
        '📋',
        'Import',
        theme.colors.success.light,
        onSelectImportRecipe
      ),
      startFromScratch: createOption(
        '✏️',
        'From Scratch',
        theme.colors.gray[200],
        onSelectStartFromScratch
      ),
    };
  }, [
    styles,
    onSelectWebImport,
    onSelectImportRecipe,
    onSelectStartFromScratch,
  ]);

  // Options Container
  const optionsSection = useMemo(() => (
    <View style={styles.optionsContainer}>
      {renderOption.websiteImport}
      {renderOption.importRecipe}
      {renderOption.startFromScratch}
    </View>
  ), [styles, renderOption]);

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      showDragIndicator={true}
      maxHeight="100%"
      avoidKeyboard={true}
    >
      <View style={styles.root}>
        {headerSection}
        {aiSection}
        {divider}
        {optionsSection}
      </View>
    </BaseModal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
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

  // Compact AI Section
  aiCompactContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
  },
  aiCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  aiCompactTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primary[700],
    flex: 1,
  },
  compactGenerationsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 2,
  },
  compactGenerationsText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  aiHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 16,
  },
  inputWrapper: {
    marginBottom: theme.spacing.sm,
  },
  aiCompactInput: {
    backgroundColor: theme.colors.surface.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    minHeight: 70,
    maxHeight: 90,
  },
  charCounter: {
    position: 'absolute',
    bottom: theme.spacing.xs,
    right: theme.spacing.xs,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    backgroundColor: theme.colors.surface.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  charCounterWarning: {
    color: theme.colors.warning.main,
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  compactGenerateButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  compactGenerateButtonDisabled: {
    opacity: 0.5,
  },
  compactGenerateButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: 'white',
  },
  generatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.primary,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray[300],
  },
  dividerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing.md,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
