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
import { useAuthStore } from '../store/store';
import { updateUserProfile } from '../modules/user/userService';
import { AvatarPickerModal } from '../components/AvatarPickerModal';

export default function SettingsScreen() {
  const { user, userProfile, setUserProfile, signOut } = useAuthStore();
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
        <Text style={styles.title}>Settings</Text>
        
        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            {/* Profile Picture */}
            <TouchableOpacity
              style={styles.profilePictureContainer}
              onPress={() => setShowAvatarPicker(true)}
            >
              {userProfile?.profilePicture ? (
                <Image
                  source={{ uri: userProfile.profilePicture }}
                  style={styles.profilePicture}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.placeholderPicture}>
                  <Feather name="user" size={48} color="#999" />
                </View>
              )}
              <View style={styles.editBadge}>
                <Feather name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{userProfile?.name || user?.displayName || 'Not set'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  placeholderPicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileInfo: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
