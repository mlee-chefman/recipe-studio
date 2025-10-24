import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { theme } from '@theme/index';
import { generatePresetAvatars } from '@utils/avatarGenerator';
import BaseModal from './BaseModal';

interface AvatarPickerModalProps {
  visible: boolean;
  currentAvatar?: string;
  onSelect: (avatarUrl: string) => Promise<void>;
  onClose: () => void;
}

export function AvatarPickerModal({
  visible,
  currentAvatar,
  onSelect,
  onClose,
}: AvatarPickerModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const presetAvatars = generatePresetAvatars(12);

  const handleSelectPreset = async (avatarUrl: string) => {
    try {
      setIsUploading(true);
      await onSelect(avatarUrl);
      onClose();
    } catch (error) {
      console.error('Error selecting avatar:', error);
      Alert.alert('Error', 'Failed to update avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadFromLibrary = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need permission to access your photo library'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const imageUri = result.assets[0].uri;

        // For now, we'll use the local URI
        // In production, you'd upload to Firebase Storage first
        await onSelect(imageUri);
        onClose();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      variant="bottom-sheet"
      showDragIndicator={true}
      maxHeight="80%"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Avatar</Text>
      </View>

          {/* Upload from Library Button */}
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadFromLibrary}
            disabled={isUploading}
          >
            <Feather name="upload" size={20} color={theme.colors.primary[500]} />
            <Text style={styles.uploadButtonText}>Upload from Photo Library</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or choose a preset</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Preset Avatars Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            {presetAvatars.map((avatarUrl, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.avatarOption,
                  currentAvatar === avatarUrl && styles.avatarOptionSelected,
                ]}
                onPress={() => handleSelectPreset(avatarUrl)}
                disabled={isUploading}
              >
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
                {currentAvatar === avatarUrl && (
                  <View style={styles.selectedBadge}>
                    <Feather name="check" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

      {/* Loading Indicator */}
      {isUploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Updating avatar...</Text>
        </View>
      )}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary[50],
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  uploadButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.primary[500],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray[200],
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    maxHeight: 400,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: 16,
    justifyContent: 'center',
  },
  avatarOption: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: theme.colors.primary[500],
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  selectedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
});
