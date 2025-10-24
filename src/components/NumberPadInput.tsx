import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';
import { useStyles } from '@hooks/useStyles';

interface NumberPadInputProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  maxValue?: number;
  minValue?: number;
}

export const NumberPadInput = ({
  label,
  value,
  onValueChange,
  maxValue = 99,
  minValue = 0
}: NumberPadInputProps) => {
  const theme = useAppTheme();
  const styles = useStyles(createStyles);

  const handleNumberPress = (num: number) => {
    const currentStr = value.toString();
    const newStr = currentStr === '0' ? num.toString() : currentStr + num.toString();
    const newValue = parseInt(newStr);

    if (newValue <= maxValue) {
      onValueChange(newValue);
    }
  };

  const handleBackspace = () => {
    const currentStr = value.toString();
    const newStr = currentStr.length > 1 ? currentStr.slice(0, -1) : '0';
    onValueChange(parseInt(newStr));
  };

  const handleClear = () => {
    onValueChange(0);
  };

  const renderButton = (label: string, onPress: () => void, variant: 'number' | 'action' = 'number') => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        variant === 'action' && styles.actionButton
      ]}
    >
      <Text style={[
        styles.buttonText,
        variant === 'action' && styles.actionButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Display */}
      <View style={styles.display}>
        <Text style={styles.displayText}>{value.toString().padStart(2, '0')}</Text>
      </View>

      {/* Number Pad */}
      <View style={styles.numberPad}>
        <View style={styles.row}>
          {renderButton('1', () => handleNumberPress(1))}
          {renderButton('2', () => handleNumberPress(2))}
          {renderButton('3', () => handleNumberPress(3))}
        </View>
        <View style={styles.row}>
          {renderButton('4', () => handleNumberPress(4))}
          {renderButton('5', () => handleNumberPress(5))}
          {renderButton('6', () => handleNumberPress(6))}
        </View>
        <View style={styles.row}>
          {renderButton('7', () => handleNumberPress(7))}
          {renderButton('8', () => handleNumberPress(8))}
          {renderButton('9', () => handleNumberPress(9))}
        </View>
        <View style={styles.row}>
          {renderButton('C', handleClear, 'action')}
          {renderButton('0', () => handleNumberPress(0))}
          {renderButton('⌫', handleBackspace, 'action')}
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  display: {
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
  },
  displayText: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  numberPad: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  actionButton: {
    backgroundColor: theme.colors.primary[100],
    borderColor: theme.colors.primary[300],
  },
  buttonText: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  actionButtonText: {
    color: theme.colors.primary[700],
  },
});
