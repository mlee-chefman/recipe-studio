import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@theme/index';
import BaseModal from './BaseModal';

interface ImportOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectWebImport: () => void;
  onSelectOCRImport: () => void;
}

export default function ImportOptionsModal({
  visible,
  onClose,
  onSelectWebImport,
  onSelectOCRImport
}: ImportOptionsModalProps) {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      showDragIndicator={true}
      maxHeight="60%"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Import Recipe</Text>
        <Text style={styles.subtitle}>Choose an import method</Text>
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
          </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
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
