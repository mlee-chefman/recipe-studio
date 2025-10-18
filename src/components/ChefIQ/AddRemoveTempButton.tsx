import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@theme/index';

interface AddRemoveTempButtonProps {
  onPress: () => void;
}

export const AddRemoveTempButton: React.FC<AddRemoveTempButtonProps> = ({ onPress }) => {
  return (
    <View>
      <View style={styles.labelSpacer} />
      <TouchableOpacity onPress={onPress} style={styles.button}>
        <View style={styles.iconContainer}>
          <Text style={styles.plusIcon}>+</Text>
        </View>
        <Text style={styles.buttonText}>Remove Temp</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  labelSpacer: {
    height: 15,
    marginBottom: 4,
  },
  button: {
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderStyle: 'dashed',
    backgroundColor: theme.colors.primary[50],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    fontSize: 18,
    color: theme.colors.primary[600],
    textAlign: 'center',
  },
  buttonText: {
    fontSize: 10,
    color: theme.colors.primary[700],
    fontWeight: '600',
    marginTop: 2,
  },
});
