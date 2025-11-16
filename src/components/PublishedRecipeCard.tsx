import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Recipe } from "~/types/recipe";
import { useStyles } from '@hooks/useStyles';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';
import { formatCookTime } from '@utils/timeFormatter';

interface PublishedRecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
}

export const PublishedRecipeCard = ({
  recipe,
  onPress,
  isSelectionMode = false,
  isSelected = false
}: PublishedRecipeCardProps) => {
  const styles = useStyles(createStyles);
  const appTheme = useAppTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <View style={[
        styles.card,
        {
          backgroundColor: appTheme.colors.surface.primary,
          borderColor: isSelected ? appTheme.colors.primary[500] : appTheme.colors.border.main
        }
      ]}>
        {/* Hero Image with Overlay */}
        <View style={styles.imageContainer}>
          {recipe.image ? (
            <Image
              source={{ uri: recipe.image }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.placeholderImage, { backgroundColor: appTheme.colors.gray[100] }]}>
              <Text style={{ fontSize: 60, color: appTheme.colors.gray[400] }}>🍽️</Text>
            </View>
          )}

          {/* Gradient Overlay for Text Readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />

          {/* Title Overlay */}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {recipe.title}
            </Text>

            {/* Quick Info Row */}
            <View style={styles.quickInfo}>
              <View style={styles.infoItem}>
                <Text style={styles.infoText}>⏱️ {formatCookTime(recipe.cookTime)}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoText}>👥 {recipe.servings}</Text>
              </View>
              {recipe.difficulty && (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoItem}>
                    <Text style={styles.infoText}>{recipe.difficulty}</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Selection Checkbox */}
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

        {/* Compact Author Info at Bottom */}
        {recipe.authorName && (
          <View style={[styles.authorContainer, { backgroundColor: appTheme.colors.surface.primary }]}>
            <View style={styles.authorContent}>
              {recipe.authorProfilePicture ? (
                <Image
                  source={{ uri: recipe.authorProfilePicture }}
                  style={styles.authorImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.authorImage, styles.authorImagePlaceholder, { backgroundColor: appTheme.colors.primary[100] }]}>
                  <Text style={{ fontSize: 12, color: appTheme.colors.primary[500] }}>
                    {recipe.authorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, { color: appTheme.colors.text.primary }]} numberOfLines={1}>
                  {recipe.authorName}
                </Text>
                <View style={styles.categoryContainer}>
                  <Text style={[styles.categoryText, { color: appTheme.colors.text.tertiary }]} numberOfLines={1}>
                    {recipe.category}
                  </Text>
                </View>
              </View>
            </View>

            {/* Favorite/Like indicator if available */}
            {recipe.isFavorite && (
              <View style={styles.favoriteIndicator}>
                <FontAwesome name="heart" size={14} color={appTheme.colors.error.main} />
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    ...theme.shadows.lg,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: 280,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  quickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 8,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  authorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  authorImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
  },
  favoriteIndicator: {
    marginLeft: 8,
  },
  checkboxOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
});
