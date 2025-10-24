import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAppTheme } from '@theme/index';

interface DropdownSelectorProps {
  options: Array<{ label: string; value: string | number }>;
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  placeholder?: string;
  maxHeight?: number;
}

export const DropdownSelector = ({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  maxHeight = 280
}: DropdownSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useAppTheme();

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <View>
      {/* Dropdown Button */}
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="border rounded-lg px-4 py-3 flex-row justify-between items-center"
        style={{
          backgroundColor: theme.colors.surface.primary,
          borderColor: theme.colors.border.main
        }}
      >
        <Text className="text-base" style={{
          color: selectedOption ? theme.colors.text.primary : theme.colors.text.disabled
        }}>
          {displayText}
        </Text>
        <Text className={`transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} style={{ color: theme.colors.text.tertiary }}>
          ▼
        </Text>
      </TouchableOpacity>

      {/* Dropdown Options */}
      {isOpen && (
        <View
          className="border border-t-0 rounded-b-lg absolute left-0 right-0 z-50"
          style={{
            top: 50,
            maxHeight,
            backgroundColor: theme.colors.surface.primary,
            borderColor: theme.colors.border.main,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            style={{ maxHeight }}
          >
            {/* Options */}
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className="px-4 py-3 border-b"
                style={{
                  backgroundColor: selectedValue === option.value ? theme.colors.primary[50] : 'transparent',
                  borderBottomColor: theme.colors.border.light
                }}
              >
                <Text className="text-base" style={{
                  color: selectedValue === option.value ? theme.colors.primary[700] : theme.colors.text.primary,
                  fontWeight: selectedValue === option.value ? '500' : '400'
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
