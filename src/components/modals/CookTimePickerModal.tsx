import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import { RECIPE_OPTIONS } from '@constants/recipeDefaults';
import BaseModal from '../BaseModal';

interface CookTimePickerModalProps {
  visible: boolean;
  hours: number;
  minutes: number;
  onHoursChange: (value: number) => void;
  onMinutesChange: (value: number) => void;
  onClose: () => void;
}

export function CookTimePickerModal({
  visible,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  onClose,
}: CookTimePickerModalProps) {
  const styles = useStyles(createStyles);

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      maxHeight={400}
      backdropOpacity={0.3}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cook Time</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.doneButton}>Done</Text>
        </TouchableOpacity>
      </View>
          <View style={styles.pickersRow}>
            {/* Hours Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Hours</Text>
              <Picker
                selectedValue={hours}
                onValueChange={onHoursChange}
                style={styles.picker}
              >
                {Array.from({ length: RECIPE_OPTIONS.MAX_HOURS + 1 }, (_, i) => i).map((num) => (
                  <Picker.Item key={num} label={`${num}`} value={num} />
                ))}
              </Picker>
            </View>
            {/* Minutes Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Minutes</Text>
              <Picker
                selectedValue={minutes}
                onValueChange={onMinutesChange}
                style={styles.picker}
              >
                {Array.from({ length: 12 }, (_, i) => i * RECIPE_OPTIONS.MINUTE_INTERVALS).map((num) => (
                  <Picker.Item key={num} label={`${num}`} value={num} />
                ))}
              </Picker>
            </View>
      </View>
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
  pickersRow: {
    flexDirection: 'row',
    height: 250,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    textAlign: 'center',
    padding: theme.spacing.md,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.secondary,
  },
  picker: {
    height: 180,
  },
});
