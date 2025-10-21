import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';
import BaseModal from './BaseModal';

interface CreateRecipeOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectWebImport: () => void;
  onSelectOCRImport: () => void;
  onSelectTextImport: () => void;
  onSelectPDFImport: () => void;
  onSelectStartFromScratch: () => void;
}

export default function CreateRecipeOptionsModal({
  visible,
  onClose,
  onSelectWebImport,
  onSelectOCRImport,
  onSelectTextImport,
  onSelectPDFImport,
  onSelectStartFromScratch
}: CreateRecipeOptionsModalProps) {
  const styles = useStyles(createStyles);

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      showDragIndicator={true}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create Recipe</Text>
        <Text style={styles.subtitle}>Choose how you'd like to start</Text>
      </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
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

            {/* OCR Import Option */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={onSelectOCRImport}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.success.light }]}>
                <Text style={styles.optionEmoji}>📸</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Scan Recipe</Text>
                <Text style={styles.optionDescription}>
                  Take a photo or upload an image to extract recipe text
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* Text Import Option */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={onSelectTextImport}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.info.light }]}>
                <Text style={styles.optionEmoji}>📝</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Import from Text/Notes</Text>
                <Text style={styles.optionDescription}>
                  Paste recipe text from Notes, Messages, or clipboard
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* PDF Import Option */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={onSelectPDFImport}
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
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* Start from Scratch Option */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={onSelectStartFromScratch}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.warning.light }]}>
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
    paddingBottom: theme.spacing.xl,
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
});
