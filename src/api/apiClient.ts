import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Cambia a 'true' para usar la API subida al servidor (Producción), o 'false' para local (Desarrollo)
export const USE_PRODUCTION_API = true;

// URL local dinámica dependiendo de si es Android o iOS/Web
export const LOCAL_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5062' : 'http://localhost:5062';

// Configuración automática de la URL base
export const BASE_URL = USE_PRODUCTION_API 
    ? 'http://Fitzone-Development.somee.com/api' 
    : `${LOCAL_URL}/api`;

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
