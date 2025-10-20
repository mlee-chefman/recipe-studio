import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Recipe } from '~/types/recipe';
import { getApplianceById } from '~/types/chefiq';
import { theme } from '@theme/index';

interface CompactRecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
}

export const CompactRecipeCard = ({
  recipe,
  onPress,
  isSelectionMode = false,
  isSelected = false
}: CompactRecipeCardProps) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View className={`bg-white rounded-lg mb-2 shadow-sm border-2 overflow-hidden ${
        isSelected ? 'border-green-500' : 'border-gray-200'
      }`}>
        <View className="flex-row">
          {/* Recipe Image */}
          {recipe.image ? (
            <Image
              source={{ uri: recipe.image }}
              style={{ width: 100, height: 100 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-[100px] h-[100px] bg-gray-100 items-center justify-center">
              <Text className="text-2xl text-gray-400">🍽️</Text>
            </View>
          )}

          {/* Recipe Content */}
          <View className="flex-1 p-3">
            <Text className="text-base font-bold text-gray-800 mb-1" numberOfLines={1}>
              {recipe.title}
            </Text>
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
              {recipe.description}
            </Text>

            {/* Info Row */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-wrap gap-1">
                <Text className="text-xs text-gray-500">⏱️ {recipe.cookTime}m</Text>
                <Text className="text-xs text-gray-500">• 👥 {recipe.servings}</Text>
                {recipe.chefiqAppliance && (
                  <>
                    <Text className="text-xs text-gray-500">•</Text>
                    <View className="px-1.5 py-0.5 rounded-full flex-row items-center" style={{ backgroundColor: theme.colors.primary[100] }}>
                      <Text className="text-xs mr-0.5">🍳</Text>
                      <Text className="text-xs font-medium" style={{ color: theme.colors.primary[500] }}>
                        {getApplianceById(recipe.chefiqAppliance)?.short_code || 'iQ'}
                      </Text>
                    </View>
                  </>
                )}
                {recipe.useProbe && (
                  <View className="bg-orange-100 px-1 py-0.5 rounded-full">
                    <Text className="text-xs">🌡️</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Tags - show max 2 */}
            {recipe.tags && recipe.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mt-1">
                {recipe.tags.slice(0, 2).map((tag, index) => (
                  <View key={index} className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.colors.primary[100] }}>
                    <Text className="text-xs" style={{ color: theme.colors.primary[700] }}>{tag}</Text>
                  </View>
                ))}
                {recipe.tags.length > 2 && (
                  <View className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.colors.gray[200] }}>
                    <Text className="text-xs" style={{ color: theme.colors.text.secondary }}>+{recipe.tags.length - 2}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Selection Checkbox Overlay */}
        {isSelectionMode && (
          <View style={styles.checkboxOverlay}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && (
                <FontAwesome name="check" size={16} color="white" />
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkboxOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
});
