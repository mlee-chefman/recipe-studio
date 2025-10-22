import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import BaseModal from './BaseModal';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@theme/index';

interface PreferenceSelectorModalProps<T extends string> {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: readonly T[];
  selectedValue: T;
  onSelect: (value: T) => void;
  getOptionLabel?: (value: T) => string;
  getOptionDescription?: (value: T) => string;
}

export function PreferenceSelectorModal<T extends string>({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  getOptionLabel,
  getOptionDescription,
}: PreferenceSelectorModalProps<T>) {
  const styles = useStyles(createStyles);
  const theme = useAppTheme();

  const handleSelect = (value: T) => {
    onSelect(value);
    onClose();
  };

  const getLabel = (value: T): string => {
    return getOptionLabel ? getOptionLabel(value) : value;
  };

  const getDescription = (value: T): string | undefined => {
    return getOptionDescription ? getOptionDescription(value) : undefined;
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      showDragIndicator={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Options List */}
        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={true}>
          {options.map((option) => {
            const isSelected = option === selectedValue;
            const label = getLabel(option);
            const description = getDescription(option);

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionItem,
                  isSelected && styles.optionItemSelected,
                ]}
                onPress={() => handleSelect(option)}
              >
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {label}
                  </Text>
                  {description && (
                    <Text style={styles.optionDescription}>{description}</Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={theme.colors.primary.main}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </BaseModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
      marginBottom: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    closeButton: {
      padding: 4,
    },
    optionsList: {
      maxHeight: 500,
    },
    optionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginVertical: 4,
      backgroundColor: theme.colors.background.secondary,
    },
    optionItemSelected: {
      backgroundColor: theme.colors.primary.light,
      borderWidth: 1,
      borderColor: theme.colors.primary.main,
    },
    optionContent: {
      flex: 1,
      marginRight: 12,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text.primary,
    },
    optionLabelSelected: {
      color: theme.colors.primary.main,
      fontWeight: '600',
    },
    optionDescription: {
      fontSize: 13,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
  });
