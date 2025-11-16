import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import BaseModal from './BaseModal';

interface CoverImageRequiredModalProps {
  visible: boolean;
  onUpload: () => void;
  onGenerateAI?: () => void;
  onCancel: () => void;
}

export function CoverImageRequiredModal({
  visible,
  onUpload,
  onGenerateAI,
  onCancel,
}: CoverImageRequiredModalProps) {
  const styles = useStyles(createStyles);

  return (
    <BaseModal
      visible={visible}
      onClose={onCancel}
      variant="centered"
      contentStyle={styles.modalContent}
    >
      <View style={styles.iconContainer}>
        <Feather name="image" size={40} color={styles.iconColor.color} />
      </View>
      <Text style={styles.title}>Cover Image Required</Text>
      <Text style={styles.message}>
        Published recipes need a cover image to look great. Choose how you'd like to add one:
      </Text>

      <View style={styles.optionsContainer}>
        {onGenerateAI && (
          <TouchableOpacity
            onPress={onGenerateAI}
            style={styles.optionButton}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons name="robot-excited" size={24} color={styles.aiIconColor.color} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Generate AI Cover</Text>
              <Text style={styles.optionDescription}>Create a unique image with AI</Text>
            </View>
            <Feather name="chevron-right" size={20} color={styles.chevronColor.color} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onUpload}
          style={styles.optionButton}
        >
          <View style={styles.optionIconContainer}>
            <Feather name="upload" size={24} color={styles.uploadIconColor.color} />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Upload Photo</Text>
            <Text style={styles.optionDescription}>Choose from your device</Text>
          </View>
          <Feather name="chevron-right" size={20} color={styles.chevronColor.color} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onCancel}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </BaseModal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  modalContent: {
    ...theme.shadows.md,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconColor: {
    color: theme.colors.primary[500],
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.text.primary,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.gray[50],
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiIconColor: {
    color: theme.colors.primary[500],
  },
  uploadIconColor: {
    color: theme.colors.secondary[500],
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  chevronColor: {
    color: theme.colors.text.tertiary,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});
