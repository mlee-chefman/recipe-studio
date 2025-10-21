import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { signIn } from '../modules/user/userAuth';
import { getUserProfile } from '../modules/user/userService';
import { useAuthStore } from '../store/store';
import { convertToAuthUser } from '../modules/user/userAuth';
import { getCredentials, saveCredentials } from '../services/keychainService';
import { setHasSignedUpBefore } from '../services/authStorageService';
import { useAppTheme } from '../theme';
import { useStyles } from '@hooks/useStyles';
import type { Theme } from '../theme';

export default function SignInScreen() {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const styles = useStyles(createStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, setUserProfile } = useAuthStore();

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      console.log('📱 Sign-in screen: Loading saved credentials...');
      const credentials = await getCredentials();
      if (credentials) {
        console.log('📱 Sign-in screen: Auto-filling credentials');
        setEmail(credentials.username);
        setPassword(credentials.password);
      } else {
        console.log('📱 Sign-in screen: No credentials to load');
      }
    };
    loadSavedCredentials();
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Sign in user
      const userCredential = await signIn({ email, password });
      const user = userCredential.user;

      // Get user profile from Firestore
      const profile = await getUserProfile(user.uid);

      // Update auth store
      const authUser = convertToAuthUser(user);
      setUser(authUser);
      setUserProfile(profile);

      // Save credentials to keychain for next time
      console.log('📱 Sign-in screen: Saving credentials...');
      const saved = await saveCredentials(email, password);
      console.log('📱 Sign-in screen: Credentials saved:', saved);

      // Mark that user has signed up before
      await setHasSignedUpBefore();

    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      
      Alert.alert('Error', errorMessage);
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => {
              // Check if we can go back (SignUp screen is in stack)
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('SignUp' as never);
              }
            }}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
});
