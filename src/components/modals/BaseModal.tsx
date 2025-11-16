import { useEffect, useRef, ReactNode } from 'react';
import { View, Modal, StyleSheet, Animated, TouchableOpacity, ViewStyle, Keyboard, Platform, KeyboardAvoidingView } from 'react-native';
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
  avoidKeyboard?: boolean;
  hasPaddingBottom?: boolean;
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
  avoidKeyboard = false,
  hasPaddingBottom = true,
}: BaseModalProps) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const styles = useStyles(createStyles);

  // Keyboard event handlers
  useEffect(() => {
    if (!avoidKeyboard || variant !== 'bottom-sheet') return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        Animated.timing(keyboardOffset, {
          toValue: -e.endCoordinates.height,
          duration: Platform.OS === 'ios' ? e.duration : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? e.duration : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [avoidKeyboard, variant, keyboardOffset]);

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
      ? { ...styles.bottomSheetContainer, paddingBottom: hasPaddingBottom ? 50 : 0 }
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

  // Android: Use simpler Modal implementation with KeyboardAvoidingView
  if (Platform.OS === 'android') {
    const getAndroidBackdropStyle = () => {
      switch (variant) {
        case 'centered':
          return [styles.androidBackdrop, styles.backdropCentered];
        case 'full-screen':
          return [styles.androidBackdrop, styles.backdropFullScreen];
        default:
          return styles.androidBackdrop;
      }
    };

    const modalContent = (
      <View
        style={[getContentContainerStyle(), contentStyle]}
        pointerEvents="auto"
      >
        {showDragIndicator && variant === 'bottom-sheet' && (
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>
        )}
        {children}
      </View>
    );

    return (
      <Modal
        visible={visible}
        animationType={variant === 'bottom-sheet' && Platform.OS !== 'android' ? 'slide' : 'fade'}
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={[getAndroidBackdropStyle(), { backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }]} pointerEvents="box-none">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleBackdropPress}
          />
          {avoidKeyboard ? (
            <KeyboardAvoidingView
              behavior="padding"
              style={{ flex: 0 }}
              keyboardVerticalOffset={0}
            >
              {modalContent}
            </KeyboardAvoidingView>
          ) : (
            modalContent
          )}
        </View>
      </Modal>
    );
  }

  // iOS: Use custom animations and backdrop
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
              transform: [
                { translateY: slideAnim },
                ...(avoidKeyboard ? [{ translateY: keyboardOffset }] : [])
              ]
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
  androidBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
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
    maxHeight: Platform.OS === 'android' ? '90%' : '85%',
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
    paddingBottom: theme.spacing.md,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.gray[300],
    borderRadius: 2,
  },
});
