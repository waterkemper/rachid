import Constants from 'expo-constants';

// Para desenvolvimento em dispositivo físico/emulador, use o IP da sua máquina
// Seu IP atual: 192.168.15.9 (descoberto via ipconfig)
// Se estiver usando simulador iOS no mesmo Mac, pode usar localhost
// Para Android ou dispositivo físico, use o IP da máquina
export const API_URL = __DEV__ 
  ? 'http://192.168.15.25image.png:3001/api'  // Use seu IP aqui para dispositivo físico/emulador
  : (Constants.expoConfig?.extra?.apiUrl || 'https://api.seusite.com/api');

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
} as const;

