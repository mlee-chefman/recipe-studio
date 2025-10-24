import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Recipe } from "~/types/recipe";
import { useStyles } from '@hooks/useStyles';
import { useAppTheme } from '@theme/index';
import type { Theme } from '@theme/index';

interface PublishedRecipeCardCompactProps {
  recipe: Recipe;
  onPress: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
}

export const PublishedRecipeCardCompact = ({
  recipe,
  onPress,
  isSelectionMode = false,
  isSelected = false
}: PublishedRecipeCardCompactProps) => {
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
        {/* Recipe Image with Overlay */}
        <View style={styles.imageContainer}>
          {recipe.image ? (
            <Image
              source={{ uri: recipe.image }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage, { backgroundColor: appTheme.colors.gray[100] }]}>
              <Text style={{ fontSize: 40, color: appTheme.colors.gray[400] }}>🍽️</Text>
            </View>
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />

          {/* Title and Info Overlay */}
          <View style={styles.overlayContent}>
            <Text style={styles.title} numberOfLines={2}>
              {recipe.title}
            </Text>
            <View style={styles.quickInfo}>
              <Text style={styles.infoText}>⏱️ {recipe.cookTime}m</Text>
              <View style={styles.infoDivider} />
              <Text style={styles.infoText}>👥 {recipe.servings}</Text>
            </View>
          </View>

          {/* Selection Checkbox */}
          {isSelectionMode && (
            <View style={styles.checkboxOverlay}>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && (
                  <FontAwesome name="check" size={12} color="white" />
                )}
              </View>
            </View>
          )}
        </View>

        {/* Author Info Footer */}
        {recipe.authorName && (
          <View style={[styles.footer, { backgroundColor: appTheme.colors.surface.primary }]}>
            <View style={styles.authorContent}>
              {recipe.authorProfilePicture ? (
                <Image
                  source={{ uri: recipe.authorProfilePicture }}
                  style={styles.authorImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.authorImage, { backgroundColor: appTheme.colors.primary[100] }]}>
                  <Text style={{ fontSize: 10, color: appTheme.colors.primary[500], fontWeight: '600' }}>
                    {recipe.authorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, { color: appTheme.colors.text.primary }]} numberOfLines={1}>
                  {recipe.authorName}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    ...theme.shadows.md,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
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
    height: '60%',
  },
  overlayContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  quickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 6,
  },
  footer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  authorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
