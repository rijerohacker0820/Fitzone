import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// === ENTORNO DEL SERVIDOR (PRODUCCIÓN) ===
// Descomenta esta línea para usar la API subida al servidor
const BASE_URL = 'http://Fitzone-Development.somee.com/api';

// === ENTORNO LOCAL (DESARROLLO) ===
// Descomenta esta línea para usar la API en tu ordenador de forma local
// Importante: Si estás en un simulador de iOS o Web, usa 'localhost'. Si estás en un emulador de Android usa '10.0.2.2'. Si es dispositivo físico, debes usar la IP de red.
//const BASE_URL = 'http://localhost:5062/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Authorization token
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await AsyncStorage.getItem('user_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error retrieving token', error);
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

export default apiClient;
