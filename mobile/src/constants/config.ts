import Constants from 'expo-constants';

export const API_URL = __DEV__ 
  ? 'http://localhost:3001/api'
  : (Constants.expoConfig?.extra?.apiUrl || 'https://api.seusite.com/api');

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
} as const;

