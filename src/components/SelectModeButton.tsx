import { forwardRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet } from 'react-native';

interface SelectModeButtonProps {
  isSelectionMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const SelectModeButton = forwardRef<typeof Pressable, SelectModeButtonProps>(
  ({ isSelectionMode, onToggle, disabled = false }, ref) => {
    return (
      <Pressable
        onPress={onToggle}
        style={styles.container}
        disabled={disabled}
      >
        {({ pressed }) => (
          <FontAwesome
            name={isSelectionMode ? "times-circle" : "edit"}
            size={22}
            color={disabled ? "#cccccc" : (isSelectionMode ? "#f44336" : "#4CAF50")}
            style={[
              styles.icon,
              {
                opacity: pressed && !disabled ? 0.5 : 1,
              },
            ]}
          />
        )}
      </Pressable>
    );
  }
);

SelectModeButton.displayName = 'SelectModeButton';

export const styles = StyleSheet.create({
  container: {
    marginRight: 10,
  },
  icon: {
    // Additional styling if needed
  },
});
