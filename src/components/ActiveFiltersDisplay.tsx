import { View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@theme/index';
import { getApplianceById } from '~/types/chefiq';

interface ActiveFiltersDisplayProps {
  selectedCategory?: string;
  selectedDifficulty?: string;
  selectedTags?: string[];
  selectedAppliance?: string;
  onCategoryRemove: () => void;
  onDifficultyRemove: () => void;
  onTagRemove: (tag: string) => void;
  onApplianceRemove: () => void;
}

export const ActiveFiltersDisplay = ({
  selectedCategory,
  selectedDifficulty,
  selectedTags = [],
  selectedAppliance,
  onCategoryRemove,
  onDifficultyRemove,
  onTagRemove,
  onApplianceRemove,
}: ActiveFiltersDisplayProps) => {
  const appTheme = useAppTheme();

  const hasActiveFilters = selectedCategory || selectedDifficulty || selectedTags.length > 0 || selectedAppliance;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <View className="mb-3">
      <Text className="text-sm font-medium mb-2" style={{ color: appTheme.colors.text.secondary }}>
        Active Filters:
      </Text>
      <View className="flex-row flex-wrap">
        {selectedCategory && (
          <View
            className="px-3 py-1 rounded-full mr-2 mb-1 flex-row items-center"
            style={{ backgroundColor: appTheme.colors.primary[100] }}>
            <Text className="text-sm mr-1" style={{ color: appTheme.colors.primary[600] }}>
              Category: {selectedCategory}
            </Text>
            <TouchableOpacity onPress={onCategoryRemove}>
              <Text className="font-bold" style={{ color: appTheme.colors.primary[600] }}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        {selectedDifficulty && (
          <View
            className="px-3 py-1 rounded-full mr-2 mb-1 flex-row items-center"
            style={{ backgroundColor: appTheme.colors.primary[100] }}>
            <Text className="text-sm mr-1" style={{ color: appTheme.colors.primary[600] }}>
              Difficulty: {selectedDifficulty}
            </Text>
            <TouchableOpacity onPress={onDifficultyRemove}>
              <Text className="font-bold" style={{ color: appTheme.colors.primary[600] }}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        {selectedTags.map((tag) => (
          <View
            key={tag}
            className="px-3 py-1 rounded-full mr-2 mb-1 flex-row items-center"
            style={{ backgroundColor: appTheme.colors.primary[100] }}>
            <Text className="text-sm mr-1" style={{ color: appTheme.colors.primary[600] }}>
              Tag: {tag}
            </Text>
            <TouchableOpacity onPress={() => onTagRemove(tag)}>
              <Text className="font-bold" style={{ color: appTheme.colors.primary[600] }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        {selectedAppliance && (
          <View
            className="px-3 py-1 rounded-full mr-2 mb-1 flex-row items-center"
            style={{ backgroundColor: appTheme.colors.primary[100] }}>
            <Text className="text-sm mr-1" style={{ color: appTheme.colors.primary[600] }}>
              Appliance: {getApplianceById(selectedAppliance)?.short_code}
            </Text>
            <TouchableOpacity onPress={onApplianceRemove}>
              <Text className="font-bold" style={{ color: appTheme.colors.primary[600] }}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};
