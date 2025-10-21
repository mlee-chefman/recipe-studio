import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Recipe } from '~/types/recipe';
import { getApplianceById } from '~/types/chefiq';
import { useStyles } from '@hooks/useStyles';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';

interface CompactRecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  showStatus?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
}

export const CompactRecipeCard = ({
  recipe,
  onPress,
  showStatus = false,
  isSelectionMode = false,
  isSelected = false
}: CompactRecipeCardProps) => {
  const appTheme = useAppTheme();
  const styles = useStyles(createStyles);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View className="rounded-lg mb-2 shadow-sm border-2 overflow-hidden" style={{
        backgroundColor: appTheme.colors.surface.primary,
        borderColor: isSelected ? appTheme.colors.primary[500] : appTheme.colors.border.main
      }}>
        <View className="flex-row">
          {/* Recipe Image */}
          <View style={{ position: 'relative' }}>
            {recipe.image ? (
              <Image
                source={{ uri: recipe.image }}
                style={{ width: 100, height: 100 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-[100px] h-[100px] items-center justify-center" style={{ backgroundColor: appTheme.colors.gray[100] }}>
                <Text className="text-2xl" style={{ color: appTheme.colors.gray[400] }}>🍽️</Text>
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
          <View className="flex-1 p-3">
            <Text className="text-base font-bold mb-1" style={{ color: appTheme.colors.text.primary }} numberOfLines={1}>
              {recipe.title}
            </Text>
            <Text className="text-sm mb-1" style={{ color: appTheme.colors.text.secondary }} numberOfLines={2}>
              {recipe.description}
            </Text>

            {/* Author */}
            {recipe.authorName && (
              <View className="flex-row items-center mb-2">
                {recipe.authorProfilePicture && (
                  <Image
                    source={{ uri: recipe.authorProfilePicture }}
                    style={{ width: 16, height: 16, borderRadius: 8, marginRight: 4 }}
                    contentFit="cover"
                  />
                )}
                <Text className="text-xs" style={{ color: appTheme.colors.text.tertiary }}>
                  By {recipe.authorName}
                </Text>
              </View>
            )}

            {/* Info Row */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-wrap gap-1">
                <Text className="text-xs" style={{ color: appTheme.colors.text.tertiary }}>⏱️ {recipe.cookTime}m</Text>
                <Text className="text-xs" style={{ color: appTheme.colors.text.tertiary }}>• 👥 {recipe.servings}</Text>
                {recipe.chefiqAppliance && (
                  <>
                    <Text className="text-xs" style={{ color: appTheme.colors.text.tertiary }}>•</Text>
                    <View className="px-1.5 py-0.5 rounded-full flex-row items-center" style={{ backgroundColor: appTheme.colors.primary[100] }}>
                      <Text className="text-xs mr-0.5">🍳</Text>
                      <Text className="text-xs font-medium" style={{ color: appTheme.colors.primary[500] }}>
                        {getApplianceById(recipe.chefiqAppliance)?.short_code || 'iQ'}
                      </Text>
                    </View>
                  </>
                )}
                {recipe.useProbe && (
                  <View className="px-1 py-0.5 rounded-full" style={{ backgroundColor: appTheme.colors.warning.light }}>
                    <Text className="text-xs">🌡️</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Tags - show max 2 */}
            {recipe.tags && recipe.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mt-1">
                {recipe.tags.slice(0, 2).map((tag, index) => (
                  <View key={index} className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: appTheme.colors.primary[100] }}>
                    <Text className="text-xs" style={{ color: appTheme.colors.primary[700] }}>{tag}</Text>
                  </View>
                ))}
                {recipe.tags.length > 2 && (
                  <View className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: appTheme.colors.gray[200] }}>
                    <Text className="text-xs" style={{ color: appTheme.colors.text.secondary }}>+{recipe.tags.length - 2}</Text>
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

const createStyles = (theme: Theme) => StyleSheet.create({
  statusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
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
