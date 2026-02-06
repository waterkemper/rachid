import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Keys for secure storage
export const SECURE_KEYS = {
  AUTH_TOKEN: 'secure_auth_token',
} as const;

// Keys for AsyncStorage (for non-sensitive data)
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token', // Legacy key for migration
  USER_PREFERENCES: 'user_preferences',
} as const;

/**
 * Check if SecureStore is available
 * SecureStore is not available in Expo Go on Android
 */
const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    // Test if we can use SecureStore
    await SecureStore.getItemAsync('__test__');
    return true;
  } catch {
    return false;
  }
};

/**
 * Save auth token securely
 * Falls back to AsyncStorage if SecureStore is not available
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(SECURE_KEYS.AUTH_TOKEN, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      // Also save to AsyncStorage as backup (for migration purposes)
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      // Fallback to AsyncStorage (less secure but works in Expo Go)
      console.warn('SecureStore not available, using AsyncStorage');
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  } catch (error) {
    console.error('Error saving token:', error);
    // Last resort fallback
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }
};

/**
 * Get auth token from secure storage
 * Also handles migration from AsyncStorage to SecureStore
 */
export const getToken = async (): Promise<string | null> => {
  try {
    let token: string | null = null;

    if (await isSecureStoreAvailable()) {
      // Try to get from SecureStore first
      token = await SecureStore.getItemAsync(SECURE_KEYS.AUTH_TOKEN);

      // If not found in SecureStore, check AsyncStorage for migration
      if (!token) {
        const legacyToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (legacyToken) {
          // Migrate token to SecureStore
          await SecureStore.setItemAsync(SECURE_KEYS.AUTH_TOKEN, legacyToken, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          });
          token = legacyToken;
          console.log('Migrated token from AsyncStorage to SecureStore');
        }
      }
    } else {
      // Fallback to AsyncStorage
      token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    // Fallback to AsyncStorage
    return AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }
};

/**
 * Remove auth token from all storage
 */
export const removeToken = async (): Promise<void> => {
  try {
    // Remove from both storages to ensure complete cleanup
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_TOKEN);
    }
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error removing token:', error);
    // Try to at least remove from AsyncStorage
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
};

/**
 * Check if user has a stored token (for quick auth check)
 */
export const hasToken = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

export default {
  saveToken,
  getToken,
  removeToken,
  hasToken,
  SECURE_KEYS,
  STORAGE_KEYS,
};
