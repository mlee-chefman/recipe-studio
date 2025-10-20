import AsyncStorage from '@react-native-async-storage/async-storage';

const HAS_SIGNED_UP_KEY = '@RecipeStudio:hasSignedUpBefore';

/**
 * Mark that user has signed up at least once
 */
export const setHasSignedUpBefore = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(HAS_SIGNED_UP_KEY, 'true');
  } catch (error) {
    console.error('Error setting hasSignedUpBefore flag:', error);
  }
};

/**
 * Check if user has signed up before
 */
export const getHasSignedUpBefore = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(HAS_SIGNED_UP_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error getting hasSignedUpBefore flag:', error);
    return false;
  }
};

/**
 * Clear the signed up flag (for testing purposes)
 */
export const clearHasSignedUpBefore = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HAS_SIGNED_UP_KEY);
  } catch (error) {
    console.error('Error clearing hasSignedUpBefore flag:', error);
  }
};
