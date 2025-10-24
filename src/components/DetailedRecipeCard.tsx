import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Recipe } from '~/types/recipe';
import { getApplianceById } from '~/types/chefiq';
import { useStyles } from '@hooks/useStyles';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';

interface DetailedRecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  showStatus?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
}

export const DetailedRecipeCard = ({
  recipe,
  onPress,
  showStatus = false,
  isSelectionMode = false,
  isSelected = false
}: DetailedRecipeCardProps) => {
  const appTheme = useAppTheme();
  const styles = useStyles(createStyles);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View
        className="mb-3 overflow-hidden rounded-lg border-2 shadow-sm"
        style={{
          backgroundColor: appTheme.colors.surface.primary,
          borderColor: isSelected ? appTheme.colors.primary[500] : appTheme.colors.border.main,
        }}>
        {/* Recipe Image */}
        <View style={{ position: 'relative' }}>
          {recipe.image ? (
            <Image
              source={{ uri: recipe.image }}
              style={{ width: '100%', height: 160 }}
              contentFit="cover"
            />
          ) : (
            <View
              className="h-40 w-full items-center justify-center"
              style={{ backgroundColor: appTheme.colors.gray[100] }}>
              <Text className="text-4xl" style={{ color: appTheme.colors.gray[400] }}>
                🍽️
              </Text>
              <Text className="mt-1 text-sm" style={{ color: appTheme.colors.text.tertiary }}>
                No Image
              </Text>
            </View>
          )}

          {/* Status Badge - Absolutely positioned on image */}
          {showStatus && (
            <View style={styles.statusBadge}>
              <View
                className="rounded-lg px-3 py-1.5"
                style={{
                  backgroundColor:
                    recipe.status === 'Published'
                      ? appTheme.colors.primary[500]
                      : appTheme.colors.gray[500],
                }}>
                <Text className="text-xs font-bold text-white">{recipe.status}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Recipe Content */}
        <View className="p-4">
          <Text className="mb-2 text-lg font-bold" style={{ color: appTheme.colors.text.primary }}>
            {recipe.title}
          </Text>
          <Text className="mb-2" style={{ color: appTheme.colors.text.secondary }} numberOfLines={2}>
            {recipe.description}
          </Text>

          {/* Author - only show on published recipes (not My Recipes) */}
          {!showStatus && recipe.authorName && (
            <View className="mb-3 flex-row items-center">
              {recipe.authorProfilePicture && (
                <Image
                  source={{ uri: recipe.authorProfilePicture }}
                  style={{ width: 20, height: 20, borderRadius: 10, marginRight: 6 }}
                  contentFit="cover"
                />
              )}
              <Text className="text-xs" style={{ color: appTheme.colors.text.tertiary }}>
                By {recipe.authorName}
              </Text>
            </View>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View className="mb-3 flex-row flex-wrap gap-1">
              {recipe.tags.slice(0, 4).map((tag, index) => (
                <View
                  key={index}
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: appTheme.colors.primary[100] }}>
                  <Text className="text-xs" style={{ color: appTheme.colors.primary[700] }}>
                    {tag}
                  </Text>
                </View>
              ))}
              {recipe.tags.length > 4 && (
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: appTheme.colors.gray[200] }}>
                  <Text className="text-xs" style={{ color: appTheme.colors.text.secondary }}>
                    +{recipe.tags.length - 4}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="mr-4 text-sm" style={{ color: appTheme.colors.text.tertiary }}>
                ⏱️ {recipe.cookTime} min
              </Text>
              <Text className="mr-4 text-sm" style={{ color: appTheme.colors.text.tertiary }}>
                👥 {recipe.servings} servings
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row flex-wrap items-center gap-1">
              <Text
                className="mr-2 text-sm font-medium"
                style={{ color: appTheme.colors.primary[500] }}>
                {recipe.category}
              </Text>
              {recipe.chefiqAppliance && (
                <View className="flex-row items-center gap-1">
                  <View
                    className="flex-row items-center rounded-full px-2 py-1"
                    style={{ backgroundColor: appTheme.colors.primary[100] }}>
                    <Text className="mr-1 text-xs">🍳</Text>
                    <Text
                      className="text-xs font-medium"
                      style={{ color: appTheme.colors.primary[500] }}>
                      {getApplianceById(recipe.chefiqAppliance)?.short_code || 'iQ'}
                    </Text>
                  </View>
                  {recipe.useProbe && (
                    <View
                      className="rounded-full px-1.5 py-0.5"
                      style={{ backgroundColor: appTheme.colors.warning.light }}>
                      <Text className="text-xs" style={{ color: appTheme.colors.warning.dark }}>
                        🌡️
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs" style={{ color: appTheme.colors.text.disabled }}>
                Tap for details →
              </Text>
            </View>
          </View>
        </View>

        {/* Selection Checkbox Overlay */}
        {isSelectionMode && (
          <View style={styles.checkboxOverlay}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <FontAwesome name="check" size={16} color="white" />}
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
    top: 8,
    right: 8,
    ...theme.shadows.md,
  },
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
