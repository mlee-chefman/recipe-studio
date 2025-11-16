import { View, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { theme } from '@theme/index';

export const RecipeCardSkeleton = ({ viewMode = 'detailed' }: { viewMode?: 'detailed' | 'compact' | 'grid' | 'published' | 'published-compact' | 'published-mini' }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (viewMode === 'published-mini') {
    return (
      <View style={styles.publishedMiniCard}>
        <Animated.View style={[styles.publishedMiniImage, { opacity }]} />
        <View style={styles.publishedMiniFooter}>
          <Animated.View style={[styles.publishedMiniAuthorAvatar, { opacity }]} />
          <View style={styles.publishedMiniAuthorInfo}>
            <Animated.View style={[styles.publishedMiniAuthorName, { opacity }]} />
          </View>
        </View>
      </View>
    );
  }

  if (viewMode === 'published-compact') {
    return (
      <View style={styles.publishedCompactCard}>
        <Animated.View style={[styles.publishedCompactImage, { opacity }]} />
        <View style={styles.publishedCompactFooter}>
          <Animated.View style={[styles.publishedCompactAuthorAvatar, { opacity }]} />
          <View style={styles.publishedCompactAuthorInfo}>
            <Animated.View style={[styles.publishedCompactAuthorName, { opacity }]} />
          </View>
        </View>
      </View>
    );
  }

  if (viewMode === 'published') {
    return (
      <View style={styles.publishedCard}>
        <Animated.View style={[styles.publishedImage, { opacity }]} />
        <View style={styles.publishedAuthorContainer}>
          <Animated.View style={[styles.publishedAuthorAvatar, { opacity }]} />
          <View style={styles.publishedAuthorInfo}>
            <Animated.View style={[styles.publishedAuthorName, { opacity }]} />
            <Animated.View style={[styles.publishedAuthorCategory, { opacity }]} />
          </View>
        </View>
      </View>
    );
  }

  if (viewMode === 'grid') {
    return (
      <View style={styles.gridCard}>
        <Animated.View style={[styles.gridImage, { opacity }]} />
        <View style={styles.gridContent}>
          <Animated.View style={[styles.gridTitle, { opacity }]} />
          <Animated.View style={[styles.gridSubtitle, { opacity }]} />
          <View style={styles.gridMeta}>
            <Animated.View style={[styles.gridMetaItem, { opacity }]} />
            <Animated.View style={[styles.gridMetaItem, { opacity }]} />
          </View>
        </View>
      </View>
    );
  }

  if (viewMode === 'compact') {
    return (
      <View style={styles.compactCard}>
        <Animated.View style={[styles.compactImage, { opacity }]} />
        <View style={styles.compactContent}>
          <Animated.View style={[styles.compactTitle, { opacity }]} />
          <Animated.View style={[styles.compactSubtitle, { opacity }]} />
          <View style={styles.compactMeta}>
            <Animated.View style={[styles.compactMetaItem, { opacity }]} />
            <Animated.View style={[styles.compactMetaItem, { opacity }]} />
          </View>
        </View>
      </View>
    );
  }

  // Detailed view
  return (
    <View style={styles.detailedCard}>
      <Animated.View style={[styles.detailedImage, { opacity }]} />
      <View style={styles.detailedContent}>
        <Animated.View style={[styles.detailedTitle, { opacity }]} />
        <Animated.View style={[styles.detailedDescription, { opacity }]} />
        <Animated.View style={[styles.detailedDescriptionShort, { opacity }]} />
        <View style={styles.detailedMeta}>
          <Animated.View style={[styles.detailedMetaItem, { opacity }]} />
          <Animated.View style={[styles.detailedMetaItem, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Detailed view styles
  detailedCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border.main,
  },
  detailedImage: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.gray[200],
  },
  detailedContent: {
    padding: theme.spacing.lg,
  },
  detailedTitle: {
    height: 24,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
    width: '70%',
  },
  detailedDescription: {
    height: 16,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
    width: '100%',
  },
  detailedDescriptionShort: {
    height: 16,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    width: '80%',
  },
  detailedMeta: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  detailedMetaItem: {
    height: 16,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    width: 80,
  },

  // Grid view styles
  gridCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border.main,
  },
  gridImage: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.gray[200],
  },
  gridContent: {
    padding: theme.spacing.md,
  },
  gridTitle: {
    height: 18,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    marginBottom: 6,
    width: '85%',
  },
  gridSubtitle: {
    height: 14,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
    width: '60%',
  },
  gridMeta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  gridMetaItem: {
    height: 12,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    width: 50,
  },

  // Compact view styles
  compactCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    flexDirection: 'row',
    height: 100,
  },
  compactImage: {
    width: 100,
    height: '100%',
    backgroundColor: theme.colors.gray[200],
  },
  compactContent: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  compactTitle: {
    height: 18,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    marginBottom: 6,
    width: '80%',
  },
  compactSubtitle: {
    height: 14,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
    width: '60%',
  },
  compactMeta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  compactMetaItem: {
    height: 12,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    width: 60,
  },

  // Published view styles
  publishedCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border.main,
  },
  publishedImage: {
    width: '100%',
    height: 280,
    backgroundColor: theme.colors.gray[200],
  },
  publishedAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  publishedAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.gray[200],
    marginRight: 10,
  },
  publishedAuthorInfo: {
    flex: 1,
  },
  publishedAuthorName: {
    height: 16,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    marginBottom: 6,
    width: '50%',
  },
  publishedAuthorCategory: {
    height: 12,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    width: '35%',
  },

  // Published compact view styles (for grid)
  publishedCompactCard: {
    flex: 1,
    backgroundColor: theme.colors.surface.primary,
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: theme.colors.border.main,
  },
  publishedCompactImage: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.gray[200],
  },
  publishedCompactFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  publishedCompactAuthorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.gray[200],
    marginRight: 6,
  },
  publishedCompactAuthorInfo: {
    flex: 1,
  },
  publishedCompactAuthorName: {
    height: 14,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    width: '60%',
  },

  // Published mini view styles (for compact view)
  publishedMiniCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  publishedMiniImage: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.gray[200],
  },
  publishedMiniFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  publishedMiniAuthorAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.gray[200],
    marginRight: 5,
  },
  publishedMiniAuthorInfo: {
    flex: 1,
  },
  publishedMiniAuthorName: {
    height: 12,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    width: '50%',
  },
});
