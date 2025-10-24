import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';
import { useImagePicker } from '@hooks/useImagePicker';
import ImagePreviewModal from './modals/ImagePreviewModal';

interface RecipeCoverImageProps {
  imageUri?: string;
  onImageChange?: (uri: string | undefined) => void;
  editable?: boolean;
  size?: 'small' | 'medium' | 'large';
  onGenerateAI?: () => void; // Optional AI generation callback
  isGeneratingAI?: boolean; // Show loading state during AI generation
}

/**
 * Recipe cover image component with thumbnail display and full-screen preview
 * Similar to StepImage but designed for recipe cover photos
 * - Tap to view full screen
 * - Optional edit/add/remove capabilities
 * - Configurable size
 */
export default function RecipeCoverImage({
  imageUri,
  onImageChange,
  editable = true,
  size = 'small',
  onGenerateAI,
  isGeneratingAI = false
}: RecipeCoverImageProps) {
  const styles = useStyles(createStyles);

  const [previewVisible, setPreviewVisible] = useState(false);

  const { showImageOptions } = useImagePicker({
    onImageSelected: (uri) => {
      onImageChange?.(uri);
    },
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.9,
  });

  const handleImagePress = () => {
    if (imageUri) {
      // Open preview if image exists
      setPreviewVisible(true);
    } else if (editable) {
      // Add image if no image and editable
      // Show options if AI generation is available, otherwise go straight to image picker
      if (onGenerateAI) {
        handleAddPress();
      } else {
        showImageOptions();
      }
    }
  };

  const handleEditPress = () => {
    if (!editable) return;

    const options = [
      {
        text: 'Replace',
        onPress: showImageOptions
      },
      {
        text: 'Remove',
        style: 'destructive' as const,
        onPress: () => onImageChange?.(''),
      },
      { text: 'Cancel', style: 'cancel' as const },
    ];

    // Add AI generation option if available
    if (onGenerateAI) {
      options.unshift({
        text: 'Generate AI Cover',
        onPress: onGenerateAI
      });
    }

    Alert.alert(
      'Image Options',
      'Choose an action',
      options
    );
  };

  const handleAddPress = () => {
    if (!editable) return;

    const options = [
      {
        text: 'Upload Photo',
        onPress: showImageOptions
      },
      { text: 'Cancel', style: 'cancel' as const },
    ];

    // Add AI generation option if available
    if (onGenerateAI) {
      options.unshift({
        text: 'Generate AI Cover',
        onPress: onGenerateAI
      });
    }

    Alert.alert(
      'Add Image',
      'Choose how to add a cover photo',
      options
    );
  };

  // If no image and not editable, don't render anything
  if (!imageUri && !editable) {
    return null;
  }

  const thumbnailStyle = size === 'small'
    ? styles.thumbnailSmall
    : size === 'medium'
    ? styles.thumbnailMedium
    : styles.thumbnailLarge;

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
              {editable && (
                <View style={styles.overlay}>
                  <Feather name="maximize-2" size={20} color={theme.colors.text.inverse} />
                </View>
              )}
            </>
          ) : isGeneratingAI ? (
            <View style={styles.addImageContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
              <Text style={styles.generatingText}>Generating...</Text>
            </View>
          ) : (
            <View style={styles.addImageContainer}>
              <Feather name="camera" size={24} color={theme.colors.gray[400]} />
            </View>
          )}
        </TouchableOpacity>

        {/* Edit button (only show if image exists and editable) */}
        {imageUri && editable && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="edit-2" size={12} color={theme.colors.text.inverse} />
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
  thumbnailSmall: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  thumbnailMedium: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  thumbnailLarge: {
    width: 160,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  emptyThumbnail: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
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
    gap: 8,
  },
  generatingText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  editButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.text.inverse,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
