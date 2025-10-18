import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@theme/index';

interface TemperatureInputProps {
  label: string;
  value: number | undefined;
  placeholder?: string;
  onChangeText: (text: string) => void;
  hasError?: boolean;
  isWarning?: boolean;
  minWidth?: number;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export const TemperatureInput: React.FC<TemperatureInputProps> = ({
  label,
  value,
  placeholder = '---',
  onChangeText,
  hasError = false,
  isWarning = false,
  minWidth = 90,
  showCloseButton = false,
  onClose,
}) => {
  const getBorderColor = () => {
    if (hasError) return theme.colors.error.main;
    if (isWarning) return theme.colors.warning.main;
    if (value !== undefined && value !== null) return theme.colors.primary[500];
    return theme.colors.gray[300];
  };

  return (
    <View>
      <View style={[styles.labelContainer, showCloseButton && styles.labelWithButton]}>
        <Text style={styles.label}>{label}</Text>
        {showCloseButton && onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={14} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor(), minWidth },
        ]}
      >
        <TextInput
          style={styles.input}
          value={value !== undefined && value !== null ? String(value) : ''}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.gray[400]}
          keyboardType="number-pad"
          returnKeyType="done"
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    height: 15,
    marginBottom: 4,
  },
  labelWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: 15,
  },
  closeButton: {
    padding: 0,
    marginLeft: 4,
  },
  inputContainer: {
    borderWidth: 2,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  input: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    padding: 0,
    minWidth: 50,
  },
});
