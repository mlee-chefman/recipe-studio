import { View, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { theme } from '@theme/index';

export const RecipeCardSkeleton = ({ viewMode = 'detailed' }: { viewMode?: 'detailed' | 'compact' | 'grid' }) => {
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
});
