import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export const useProteinGuideAnimations = (
  showProteinGuide: boolean,
  expandedProtein: string | null
) => {
  const proteinGuideAnimation = useRef(new Animated.Value(0)).current;
  const donenessAnimation = useRef(new Animated.Value(0)).current;

  // Animate protein guide show/hide
  useEffect(() => {
    Animated.timing(proteinGuideAnimation, {
      toValue: showProteinGuide ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showProteinGuide, proteinGuideAnimation]);

  // Animate doneness options show/hide
  useEffect(() => {
    Animated.timing(donenessAnimation, {
      toValue: expandedProtein ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expandedProtein, donenessAnimation]);

  return {
    proteinGuideAnimation,
    donenessAnimation,
  };
};
