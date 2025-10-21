import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { signOutUser } from '../modules/user/userAuth';
import { useAuthStore, useThemeStore } from '../store/store';
import { updateUserProfile } from '../modules/user/userService';
import { AvatarPickerModal } from '../components/AvatarPickerModal';
import { theme } from '@theme/index';
import { themeMetadata, ThemeVariant } from '@theme/variants';

export default function SettingsScreen() {
  const { user, userProfile, setUserProfile, signOut } = useAuthStore();
  const { themeVariant, setThemeVariant } = useThemeStore();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      // Update profile in Firebase
      await updateUserProfile(user.uid, { profilePicture: avatarUrl });

      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          profilePicture: avatarUrl,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Sign out from Firebase
              await signOutUser();

              // Clear local auth state
              // Note: We keep credentials saved in secure storage
              // so user can easily sign back in
              signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.profileCard}>
            {/* Profile Picture */}
            <TouchableOpacity
              style={styles.profilePictureContainer}
              onPress={() => setShowAvatarPicker(true)}>
              {userProfile?.profilePicture ? (
                <Image
                  source={{ uri: userProfile.profilePicture }}
                  style={styles.profilePicture}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.placeholderPicture}>
                  <Feather name="user" size={48} color={theme.colors.gray[400]} />
                </View>
              )}
              <View style={styles.editBadge}>
                <Feather name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>
                {userProfile?.name || user?.displayName || 'Not set'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Theme Selector Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.themeContainer}>
            {(Object.keys(themeMetadata) as ThemeVariant[]).map((variant) => {
              const meta = themeMetadata[variant];
              const isSelected = themeVariant === variant;

              return (
                <TouchableOpacity
                  key={variant}
                  style={[
                    styles.themeOption,
                    isSelected && styles.themeOptionSelected,
                  ]}
                  onPress={() => setThemeVariant(variant)}
                  activeOpacity={0.7}
                >
                  {/* Color Preview Circle */}
                  <View
                    style={[
                      styles.colorPreview,
                      { backgroundColor: meta.accentColor },
                    ]}
                  >
                    {isSelected && (
                      <Feather name="check" size={20} color="white" />
                    )}
                  </View>

                  {/* Theme Info */}
                  <View style={styles.themeInfo}>
                    <Text style={styles.themeName}>{meta.name}</Text>
                    <Text style={styles.themeDescription}>{meta.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account Section */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        visible={showAvatarPicker}
        currentAvatar={userProfile?.profilePicture}
        onSelect={handleAvatarSelect}
        onClose={() => setShowAvatarPicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: 'bold',
    marginBottom: theme.spacing['3xl'],
    color: theme.colors.text.primary,
  },
  section: {
    marginBottom: theme.spacing['3xl'],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.primary,
  },
  profileCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    position: 'relative',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.gray[100],
  },
  placeholderPicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: theme.colors.info.main,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface.primary,
  },
  profileInfo: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  signOutButton: {
    backgroundColor: theme.colors.error.main,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  signOutText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  themeContainer: {
    gap: theme.spacing.md,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  themeOptionSelected: {
    borderColor: theme.colors.primary[500],
    borderWidth: 2,
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  themeDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
