import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '@theme/index';

interface ProteinGuideButtonProps {
  showProteinGuide: boolean;
  onPress: () => void;
}

export const ProteinGuideButton: React.FC<ProteinGuideButtonProps> = ({
  showProteinGuide,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        showProteinGuide ? styles.buttonActive : styles.buttonInactive,
      ]}
    >
      <Text style={[styles.buttonText, showProteinGuide && styles.buttonTextActive]}>
        {showProteinGuide ? 'Hide' : 'Suggestions'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  buttonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[600],
  },
  buttonInactive: {
    backgroundColor: theme.colors.primary[100],
    borderColor: theme.colors.primary[300],
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary[700],
  },
  buttonTextActive: {
    color: 'white',
  },
});
