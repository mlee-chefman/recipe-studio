import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface UseImagePickerOptions {
  onImageSelected?: (uri: string) => void;
  onImagesSelected?: (uris: string[]) => void;
  allowsEditing?: boolean;
  allowsMultipleSelection?: boolean;
  aspect?: [number, number];
  quality?: number;
}

export function useImagePicker(options: UseImagePickerOptions = {}) {
  const {
    onImageSelected,
    onImagesSelected,
    allowsEditing = true,
    allowsMultipleSelection = false,
    aspect = [4, 3],
    quality = 0.8,
  } = options;

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  /**
   * Pick an image (or multiple images) from the photo library
   */
  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permissions are required.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: allowsMultipleSelection ? false : allowsEditing, // Disable editing when selecting multiple
      allowsMultipleSelection,
      aspect,
      quality,
    });

    if (!result.canceled && result.assets.length > 0) {
      if (allowsMultipleSelection) {
        const uris = result.assets.map(asset => asset.uri);
        onImagesSelected?.(uris);
        return uris;
      } else {
        const uri = result.assets[0].uri;
        onImageSelected?.(uri);
        return uri;
      }
    }

    return null;
  };

  /**
   * Take a photo using the camera
   */
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permissions are required to take photos.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing,
      aspect,
      quality,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      onImageSelected?.(uri);
      return uri;
    }

    return null;
  };

  /**
   * Show image picker options (Camera or Library)
   */
  const showImageOptions = () => {
    setIsPickerOpen(true);
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => { takePhoto(); setIsPickerOpen(false); } },
        { text: 'Photo Library', onPress: () => { pickFromLibrary(); setIsPickerOpen(false); } },
        { text: 'Cancel', style: 'cancel', onPress: () => setIsPickerOpen(false) }
      ]
    );
  };

  return {
    pickFromLibrary,
    takePhoto,
    showImageOptions,
    isPickerOpen,
  };
}
