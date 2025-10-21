import { useEffect, useRef, ReactNode } from 'react';
import { View, Modal, StyleSheet, Animated, TouchableOpacity, ViewStyle } from 'react-native';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '@theme/index';

type ModalVariant = 'bottom-sheet' | 'centered' | 'full-screen';

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  variant?: ModalVariant;
  showDragIndicator?: boolean;
  backdropOpacity?: number;
  maxHeight?: string | number;
  enableBackdropClose?: boolean;
  contentStyle?: ViewStyle;
}

export default function BaseModal({
  visible,
  onClose,
  children,
  variant = 'bottom-sheet',
  showDragIndicator = false,
  backdropOpacity = 0.5,
  maxHeight,
  enableBackdropClose = true,
  contentStyle,
}: BaseModalProps) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const styles = useStyles(createStyles);

  useEffect(() => {
    if (visible) {
      if (variant === 'bottom-sheet') {
        // Slide animation for bottom sheet
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }).start();
      } else {
        // Fade animation for centered/full-screen
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } else {
      if (variant === 'bottom-sheet') {
        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 250,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible, slideAnim, fadeAnim, variant]);

  const getBackdropStyle = () => {
    switch (variant) {
      case 'bottom-sheet':
        return styles.backdropBottomSheet;
      case 'centered':
        return styles.backdropCentered;
      case 'full-screen':
        return styles.backdropFullScreen;
      default:
        return styles.backdropBottomSheet;
    }
  };

  const getContentContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = variant === 'bottom-sheet'
      ? styles.bottomSheetContainer
      : variant === 'centered'
      ? styles.centeredContainer
      : styles.fullScreenContainer;

    if (maxHeight) {
      return { ...baseStyle, maxHeight };
    }
    return baseStyle;
  };

  const handleBackdropPress = () => {
    if (enableBackdropClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[getBackdropStyle(), { backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />

        <Animated.View
          style={[
            getContentContainerStyle(),
            variant === 'bottom-sheet' && {
              transform: [{ translateY: slideAnim }]
            },
            variant !== 'bottom-sheet' && {
              opacity: fadeAnim
            }
          ]}
        >
          {showDragIndicator && variant === 'bottom-sheet' && (
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
          )}
          <View style={contentStyle}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  backdropBottomSheet: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropFullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetContainer: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  centeredContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    width: '85%',
    maxWidth: 400,
    padding: theme.spacing.xl,
  },
  fullScreenContainer: {
    backgroundColor: theme.colors.background.primary,
    width: '100%',
    height: '100%',
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.gray[300],
    borderRadius: 2,
  },
});
