import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import BaseModal from '../BaseModal';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'primary',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const styles = useStyles(createStyles);

  const confirmButtonStyle = confirmStyle === 'danger'
    ? styles.dangerButton
    : styles.primaryButton;

  return (
    <BaseModal
      visible={visible}
      onClose={onCancel}
      variant="centered"
      contentStyle={styles.modalContent}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onConfirm}
          style={confirmButtonStyle}
        >
          <Text style={styles.confirmButtonText}>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  modalContent: {
    ...theme.shadows.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    color: theme.colors.text.primary,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.text.secondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
  },
  dangerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.error.main,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
