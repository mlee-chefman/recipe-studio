import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '@theme/index';
import { RECIPE_OPTIONS } from '@constants/recipeDefaults';
import BaseModal from '../BaseModal';

interface CategoryPickerModalProps {
  visible: boolean;
  selectedValue: string;
  onValueChange: (value: string) => void;
  onClose: () => void;
}

export function CategoryPickerModal({
  visible,
  selectedValue,
  onValueChange,
  onClose,
}: CategoryPickerModalProps) {
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
        <Text style={styles.title}>Category</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.doneButton}>Done</Text>
        </TouchableOpacity>
      </View>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        <Picker.Item label="Uncategorized" value="" />
        {RECIPE_OPTIONS.CATEGORIES.map((cat) => (
          <Picker.Item key={cat} label={cat} value={cat} />
        ))}
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
