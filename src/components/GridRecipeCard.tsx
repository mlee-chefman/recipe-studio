import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Recipe } from "~/types/recipe";
import { getApplianceById } from '~/types/chefiq';
import { useStyles } from '@hooks/useStyles';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';

interface GridRecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  showStatus?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
}

export const GridRecipeCard = ({
  recipe,
  onPress,
  showStatus = false,
  isSelectionMode = false,
  isSelected = false
}: GridRecipeCardProps) => {
  const styles = useStyles(createStyles);
  const appTheme = useAppTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-1">
      <View className="rounded-lg shadow-sm border-2 overflow-hidden" style={{
        backgroundColor: appTheme.colors.surface.primary,
        borderColor: isSelected ? appTheme.colors.primary[500] : appTheme.colors.border.main
      }}>
        {/* Recipe Image */}
        <View style={{ position: 'relative' }}>
          {recipe.image ? (
            <Image
              source={{ uri: recipe.image }}
              style={{ width: '100%', height: 120 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-full h-[120px] items-center justify-center" style={{ backgroundColor: appTheme.colors.gray[100] }}>
              <Text className="text-3xl" style={{ color: appTheme.colors.gray[400] }}>🍽️</Text>
            </View>
          )}

          {/* Status Badge - Absolutely positioned on image */}
          {showStatus && (
            <View style={styles.statusBadge}>
              <View className="px-2 py-1 rounded" style={{
                backgroundColor: recipe.status === 'Published' ? appTheme.colors.success.main : appTheme.colors.warning.main
              }}>
                <Text className="text-xs font-bold text-white">
                  {recipe.status}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Recipe Content */}
        <View className="p-2">
          <Text className="text-sm font-bold mb-1" style={{ color: appTheme.colors.text.primary }} numberOfLines={2}>
            {recipe.title}
          </Text>

          {/* Author - only show on published recipes (not My Recipes) */}
          {!showStatus && recipe.authorName && (
            <View className="flex-row items-center mb-1">
              {recipe.authorProfilePicture && (
                <Image
                  source={{ uri: recipe.authorProfilePicture }}
                  style={{ width: 14, height: 14, borderRadius: 7, marginRight: 4 }}
                  contentFit="cover"
                />
              )}
              <Text className="text-xs" style={{ color: appTheme.colors.text.tertiary }} numberOfLines={1}>
                {recipe.authorName}
              </Text>
            </View>
          )}

          {/* Quick Info */}
          <View className="flex-row items-center mb-1">
            <Text className="text-xs mr-2" style={{ color: appTheme.colors.text.tertiary }}>⏱️ {recipe.cookTime}m</Text>
            <Text className="text-xs" style={{ color: appTheme.colors.text.tertiary }}>👥 {recipe.servings}</Text>
          </View>

          {/* Category & Appliance */}
          <View className="flex-row items-center flex-wrap gap-1">
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: appTheme.colors.primary[100] }}>
              <Text className="text-xs font-medium" style={{ color: appTheme.colors.primary[600] }}>
                {recipe.category}
              </Text>
            </View>
            {recipe.chefiqAppliance && (
              <View className="px-1.5 py-0.5 rounded-full flex-row items-center" style={{ backgroundColor: appTheme.colors.primary[100] }}>
                <Text className="text-xs mr-0.5">🍳</Text>
                <Text className="text-xs font-medium" style={{ color: appTheme.colors.primary[500] }}>
                  {getApplianceById(recipe.chefiqAppliance)?.short_code || 'iQ'}
                </Text>
              </View>
            )}
          </View>

          {/* First tag only */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View className="mt-1">
              <Text className="text-xs" style={{ color: appTheme.colors.text.tertiary }} numberOfLines={1}>
                {recipe.tags[0]}{recipe.tags.length > 1 ? ` +${recipe.tags.length - 1}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Selection Checkbox Overlay */}
        {isSelectionMode && (
          <View style={styles.checkboxOverlay}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && (
                <FontAwesome name="check" size={14} color="white" />
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  statusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    ...theme.shadows.md,
  },
  checkboxOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
});
