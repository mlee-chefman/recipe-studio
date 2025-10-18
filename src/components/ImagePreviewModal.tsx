import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { theme } from '@theme/index';

interface ImagePreviewModalProps {
  visible: boolean;
  imageUri?: string;
  onClose: () => void;
}

/**
 * Full-screen image preview modal
 * Displays an image in full screen with a close button
 */
export default function ImagePreviewModal({ visible, imageUri, onClose }: ImagePreviewModalProps) {
  if (!imageUri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Background overlay */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Image */}
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="contain"
        />

        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Feather name="x" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
