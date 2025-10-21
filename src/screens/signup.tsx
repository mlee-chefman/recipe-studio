import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signUp , convertToAuthUser } from '../modules/user/userAuth';
import { createUserProfile, updateUserProfile } from '../modules/user/userService';
import { useAuthStore } from '../store/store';
import { AvatarPickerModal } from '../components/AvatarPickerModal';
import { generateAvatarUrl } from '../utils/avatarGenerator';
import { saveCredentials } from '../services/keychainService';
import { setHasSignedUpBefore } from '../services/authStorageService';
import { useStyles } from '@hooks/useStyles';
import { theme } from '@theme/index';
import type { Theme } from '@theme/index';

export default function SignUpScreen() {
  const styles = useStyles(createStyles);

  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const { setUser, setUserProfile } = useAuthStore();

  const handleAvatarSelect = async (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const userCredential = await signUp({ email, password, name });
      const user = userCredential.user;

      // Create user profile in Firestore (creates with default avatar)
      await createUserProfile({
        uid: user.uid,
        email: user.email || email,
        name: name,
      });

      // If user selected a custom avatar, update it
      const avatarToUse = selectedAvatar || generateAvatarUrl(user.uid);
      if (selectedAvatar) {
        await updateUserProfile(user.uid, { profilePicture: selectedAvatar });
      }

      // Update auth store
      const authUser = convertToAuthUser(user);
      setUser(authUser);

      // Set user profile
      setUserProfile({
        uid: user.uid,
        email: user.email || email,
        name: name,
        profilePicture: avatarToUse,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Save credentials to keychain for auto-login
      console.log('📱 Sign-up screen: Saving credentials...');
      const saved = await saveCredentials(email, password);
      console.log('📱 Sign-up screen: Credentials saved:', saved);

      // Mark that user has signed up before
      await setHasSignedUpBefore();

      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          {/* Avatar Selection */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setShowAvatarPicker(true)}
          >
            <View style={styles.avatarWrapper}>
              {selectedAvatar ? (
                <Image
                  source={{ uri: selectedAvatar }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Feather name="user" size={40} color={theme.colors.gray[400]} />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Feather name="camera" size={14} color="white" />
              </View>
            </View>
            <Text style={styles.avatarText}>Choose Avatar</Text>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => {
              // Check if we can go back (SignIn screen is in stack)
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('SignIn' as never);
              }
            }}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        visible={showAvatarPicker}
        currentAvatar={selectedAvatar}
        onSelect={handleAvatarSelect}
        onClose={() => setShowAvatarPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  formContainer: {
    backgroundColor: theme.colors.surface.primary,
    padding: theme.spacing['3xl'],
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.md,
  },
  title: {
    ...theme.typography.styles.h1,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    marginBottom: theme.spacing['3xl'],
    color: theme.colors.text.secondary,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.primary,
  },
  input: {
    ...theme.components.input.default,
    padding: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.gray[300],
    opacity: theme.opacity.disabled,
  },
  buttonText: {
    color: theme.colors.text.inverse,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  linkText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[100],
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.xl,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface.primary,
  },
  avatarText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
});
