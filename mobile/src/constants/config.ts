// Para desenvolvimento em dispositivo físico/emulador, use o IP da sua máquina
// Seu IP atual: 192.168.15.9 (descoberto via ipconfig)
// Se estiver usando simulador iOS no mesmo Mac, pode usar localhost
// Para Android ou dispositivo físico, use o IP da máquina

// Use EXPO_PUBLIC_API_URL from EAS build or fallback to development IP
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.rachacontas.com/api';
const DEVELOPMENT_API_URL = 'http://192.168.48.75:3001/api'; // Use seu IP para dispositivo físico/emulador

export const API_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

