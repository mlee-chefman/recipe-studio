import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme, useAppTheme } from '@theme/index';

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
  const appTheme = useAppTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-3 border rounded-lg px-4 py-3"
      style={{
        backgroundColor: appTheme.colors.surface.primary,
        borderColor: appTheme.colors.border.main
      }}
      testID={testID}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-medium" style={{ color: appTheme.colors.text.primary }}>{label}</Text>
        <View className="flex-row items-center">
          {typeof value === 'string' ? (
            <Text className="text-base mr-2" style={{ color: appTheme.colors.text.secondary }}>{value}</Text>
          ) : (
            <View className="mr-2">{value}</View>
          )}
          <Feather name="chevron-right" size={20} color={theme.colors.text.secondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};
