import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import { RECIPE_OPTIONS } from '@constants/recipeDefaults';
import BaseModal from '../BaseModal';

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
  const styles = useStyles(createStyles);

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      maxHeight={350}
      backdropOpacity={0.3}
    >
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
    </BaseModal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
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
