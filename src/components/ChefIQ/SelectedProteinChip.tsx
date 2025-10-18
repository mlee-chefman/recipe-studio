import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@theme/index';
import { PROTEIN_LABELS, DONENESS_LABELS } from '@constants/temperatureGuide';

interface SelectedProteinChipProps {
  proteinInfo: {
    proteinKey: string;
    donenessKey: string;
    icon: string;
  };
  onRemove: () => void;
}

export const SelectedProteinChip: React.FC<SelectedProteinChipProps> = ({
  proteinInfo,
  onRemove,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Image source={{ uri: proteinInfo.icon }} style={styles.icon} resizeMode="contain" />
      </View>
      <Text style={styles.text}>
        {PROTEIN_LABELS[proteinInfo.proteinKey]} - {DONENESS_LABELS[proteinInfo.donenessKey]}
      </Text>
      <TouchableOpacity onPress={onRemove} style={styles.closeButton}>
        <Feather name="x" size={16} color={theme.colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary[800],
  },
  closeButton: {
    padding: 4,
  },
});
