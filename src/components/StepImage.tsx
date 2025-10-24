import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';
import { useImagePicker } from '@hooks/useImagePicker';
import ImagePreviewModal from './modals/ImagePreviewModal';

interface StepImageProps {
  imageUri?: string;
  onImageChange?: (uri: string | undefined) => void;
  editable?: boolean;
  compact?: boolean; // Smaller inline version
}

/**
 * Step image component with thumbnail display and full-screen preview
 * - Small thumbnail for browsing recipe
 * - Tap to view full screen
 * - Optional edit/add/remove capabilities
 * - Compact mode for inline display
 */
export default function StepImage({ imageUri, onImageChange, editable = false, compact = false }: StepImageProps) {
  const styles = useStyles(createStyles);

  const [previewVisible, setPreviewVisible] = useState(false);

  const { showImageOptions } = useImagePicker({
    onImageSelected: (uri) => {
      onImageChange?.(uri);
    },
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  const handleImagePress = () => {
    if (imageUri) {
      // Open preview if image exists
      setPreviewVisible(true);
    } else if (editable) {
      // Add image if no image and editable
      showImageOptions();
    }
  };

  const handleRemoveImage = () => {
    if (!editable) return;

    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this step image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onImageChange?.(undefined),
        },
      ]
    );
  };

  // If no image and not editable, don't render anything
  if (!imageUri && !editable) {
    return null;
  }

  const thumbnailStyle = compact ? styles.thumbnailCompact : styles.thumbnail;
  const iconSize = compact ? 14 : 20;
  const removeButtonStyle = compact ? styles.removeButtonCompact : styles.removeButton;

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={[thumbnailStyle, !imageUri && styles.emptyThumbnail]}
          onPress={handleImagePress}
          activeOpacity={0.7}
        >
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                contentFit="cover"
              />
              {editable && !compact && (
                <View style={styles.overlay}>
                  <Feather name="maximize-2" size={16} color={theme.colors.text.inverse} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.addImageContainer}>
              <Feather name="camera" size={iconSize} color={theme.colors.gray[400]} />
            </View>
          )}
        </TouchableOpacity>

        {/* Remove button (only show if image exists and editable) */}
        {imageUri && editable && (
          <TouchableOpacity
            style={removeButtonStyle}
            onPress={handleRemoveImage}
          >
            <Feather name="x" size={compact ? 10 : 14} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>

      {/* Full-screen preview modal */}
      {imageUri && (
        <ImagePreviewModal
          visible={previewVisible}
          imageUri={imageUri}
          onClose={() => setPreviewVisible(false)}
        />
      )}
    </>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  thumbnailCompact: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  emptyThumbnail: {
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.error.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.text.inverse,
  },
  removeButtonCompact: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.text.inverse,
  },
});
