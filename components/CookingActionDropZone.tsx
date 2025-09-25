import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';

interface CookingActionDropZoneProps {
  stepIndex: number;
  isActive: boolean;
  hasExistingAction: boolean;
}

export function CookingActionDropZone({
  stepIndex,
  isActive,
  hasExistingAction,
}: CookingActionDropZoneProps) {
  if (!isActive) return null;

  return (
    <View
      className="border-2 border-dashed rounded-lg p-3 mt-2 items-center justify-center"
      style={{
        borderColor: hasExistingAction ? theme.colors.warning.main : theme.colors.primary[300],
        backgroundColor: hasExistingAction
          ? `${theme.colors.warning.main}20`
          : `${theme.colors.primary[100]}20`,
      }}
    >
      <Feather
        name={hasExistingAction ? "alert-triangle" : "plus-circle"}
        size={20}
        color={hasExistingAction ? theme.colors.warning.main : theme.colors.primary[500]}
      />
      <Text
        className="text-sm font-medium mt-1"
        style={{
          color: hasExistingAction ? theme.colors.warning.main : theme.colors.primary[700],
        }}
      >
        {hasExistingAction
          ? `Replace cooking action for step ${stepIndex + 1}?`
          : `Drop cooking action for step ${stepIndex + 1}`
        }
      </Text>
    </View>
  );
}