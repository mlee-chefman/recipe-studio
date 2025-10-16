import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '@theme/index';
import { RECIPE_OPTIONS } from '@constants/recipeDefaults';

interface ServingsPickerModalProps {
  visible: boolean;
  selectedValue: number;
  onValueChange: (value: number) => void;
  onClose: () => void;
}

export function ServingsPickerModal({
  visible,
  selectedValue,
  onValueChange,
  onClose,
}: ServingsPickerModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        {/* Bottom Sheet */}
        <View style={styles.bottomSheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Servings</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={selectedValue}
            onValueChange={onValueChange}
            style={styles.picker}
          >
            {Array.from({ length: RECIPE_OPTIONS.MAX_SERVINGS }, (_, i) => i + 1).map((num) => (
              <Picker.Item key={num} label={`${num} serving${num > 1 ? 's' : ''}`} value={num} />
            ))}
          </Picker>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: 350,
  },
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
