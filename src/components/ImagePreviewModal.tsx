import { TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';
import BaseModal from './BaseModal';

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
  const styles = useStyles(createStyles);

  if (!imageUri) return null;

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="full-screen"
      backdropOpacity={0.95}
      contentStyle={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Image */}
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        contentFit="contain"
      />

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Feather name="x" size={28} color={theme.colors.text.inverse} />
      </TouchableOpacity>
    </BaseModal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
