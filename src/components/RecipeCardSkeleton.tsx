import { View, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';

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
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  detailedImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E5E7EB',
  },
  detailedContent: {
    padding: 16,
  },
  detailedTitle: {
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  detailedDescription: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
    width: '100%',
  },
  detailedDescriptionShort: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
    width: '80%',
  },
  detailedMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  detailedMetaItem: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: 80,
  },

  // Grid view styles
  gridCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  gridImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E5E7EB',
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
    width: '85%',
  },
  gridSubtitle: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  gridMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  gridMetaItem: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: 50,
  },

  // Compact view styles
  compactCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    height: 100,
  },
  compactImage: {
    width: 100,
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  compactContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  compactTitle: {
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
    width: '80%',
  },
  compactSubtitle: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  compactMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  compactMetaItem: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: 60,
  },
});
