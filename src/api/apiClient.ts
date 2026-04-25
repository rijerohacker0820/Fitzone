import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import storage from '../utils/secureStorage';
import { ENV } from '../config/env';

export const BASE_URL = ENV.API_URL;

/**
 * Logout callback — set by UserContext so the interceptor can
 * trigger a logout on 401 without circular imports.
 */
let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (cb: () => void) => {
    onUnauthorized = cb;
};

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

/**
 * Request interceptor:
 * - Adds Authorization header from secure storage
 * - Cleans payload: removes undefined/null values before sending
 */
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await storage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('[apiClient] Error retrieving token:', error);
        }

        // Clean payload — never send undefined or null fields
        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
            config.data = Object.fromEntries(
                Object.entries(config.data).filter(([_, v]) => v !== undefined && v !== null)
            );
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor:
 * - Unwraps { success, data, message } pattern from backend
 * - Handles 401 → auto-logout
 * - Throws readable error messages from backend responses
 */
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // If backend wraps response in { success, data }, unwrap it
        const body = response.data;
        if (body && typeof body === 'object' && 'success' in body) {
            if (!body.success) {
                const errorMsg = body.message || 'Error desconocido del servidor';
                return Promise.reject(new Error(errorMsg));
            }
            // Return the unwrapped data if present, otherwise the full body
            response.data = body.data !== undefined ? body.data : body;
        }
        return response;
    },
    async (error: AxiosError) => {
        if (error.response) {
            // 401 — token expired or invalid → auto-logout
            if (error.response.status === 401) {
                await storage.removeItem('auth_token');
                if (onUnauthorized) {
                    onUnauthorized();
                }
                return Promise.reject(new Error('Sesión expirada. Inicia sesión nuevamente.'));
            }

            const data = error.response.data as any;
            const message =
                data?.message ||
                data?.title ||
                (typeof data === 'string' ? data : null) ||
                `Error ${error.response.status}`;
            return Promise.reject(new Error(message));
        }

        if (error.code === 'ECONNABORTED') {
            return Promise.reject(new Error('La solicitud tardó demasiado. Revisa tu conexión.'));
        }

        return Promise.reject(new Error('Sin conexión al servidor. Verifica tu internet.'));
    }
);

export default apiClient;
