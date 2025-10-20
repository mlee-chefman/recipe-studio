import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'RecipeStudio_Credentials';

export interface StoredCredentials {
  username: string;
  password: string;
}

/**
 * Save user credentials to secure storage
 */
export const saveCredentials = async (
  email: string,
  password: string
): Promise<boolean> => {
  try {
    const credentials = JSON.stringify({ username: email, password });
    await SecureStore.setItemAsync(CREDENTIALS_KEY, credentials);
    console.log('✅ Credentials saved successfully for:', email);
    return true;
  } catch (error) {
    console.error('❌ Error saving credentials to secure storage:', error);
    return false;
  }
};

/**
 * Get saved credentials from secure storage
 */
export const getCredentials = async (): Promise<StoredCredentials | null> => {
  try {
    const credentialsStr = await SecureStore.getItemAsync(CREDENTIALS_KEY);

    if (credentialsStr) {
      const credentials = JSON.parse(credentialsStr);
      console.log('✅ Credentials retrieved successfully for:', credentials.username);
      return {
        username: credentials.username,
        password: credentials.password,
      };
    }
    console.log('ℹ️ No saved credentials found');
    return null;
  } catch (error) {
    console.error('❌ Error retrieving credentials from secure storage:', error);
    return null;
  }
};

/**
 * Remove saved credentials from secure storage
 */
export const removeCredentials = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    return true;
  } catch (error) {
    console.error('Error removing credentials from secure storage:', error);
    return false;
  }
};
