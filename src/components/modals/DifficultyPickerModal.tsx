import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '@theme/index';
import BaseModal from '../BaseModal';

interface DifficultyPickerModalProps {
  visible: boolean;
  selectedValue: 'Easy' | 'Medium' | 'Hard';
  onValueChange: (value: 'Easy' | 'Medium' | 'Hard') => void;
  onClose: () => void;
}

export function DifficultyPickerModal({
  visible,
  selectedValue,
  onValueChange,
  onClose,
}: DifficultyPickerModalProps) {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      maxHeight={450}
      backdropOpacity={0.3}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Difficulty</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.doneButton}>Done</Text>
        </TouchableOpacity>
      </View>
      <Picker
        selectedValue={selectedValue}
        onValueChange={(value) => onValueChange(value as 'Easy' | 'Medium' | 'Hard')}
        style={styles.picker}
      >
        <Picker.Item label="Easy" value="Easy" />
        <Picker.Item label="Medium" value="Medium" />
        <Picker.Item label="Hard" value="Hard" />
      </Picker>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  cancelButton: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary[500],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  doneButton: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.primary[500],
  },
  picker: {
    height: 200,
  },
});
