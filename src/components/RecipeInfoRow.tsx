import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@theme/index';

interface RecipeInfoRowProps {
  label: string;
  value: string | ReactNode;
  onPress: () => void;
  testID?: string;
}

/**
 * Reusable row component for recipe info fields
 * Displays a label on the left and value on the right with a chevron
 */
export const RecipeInfoRow: React.FC<RecipeInfoRowProps> = ({
  label,
  value,
  onPress,
  testID,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-3 border border-gray-200 rounded-lg px-4 py-3 bg-white"
      testID={testID}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-medium text-gray-800">{label}</Text>
        <View className="flex-row items-center">
          {typeof value === 'string' ? (
            <Text className="text-base text-gray-600 mr-2">{value}</Text>
          ) : (
            <View className="mr-2">{value}</View>
          )}
          <Feather name="chevron-right" size={20} color={theme.colors.text.secondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};
