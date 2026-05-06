import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import storage from "../utils/secureStorage";
import { ENV } from "../config/env";

export const BASE_URL = ENV.API_URL;

export const getImageUrl = (path?: string | null): string => {
  if (!path) return "";
  if (
    path.startsWith("http") ||
    path.startsWith("file://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const serverUrl = BASE_URL.replace(/\/api\/?$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${serverUrl}/${cleanPath}`;
};

export const getAvatarUrl = (path?: string | null): string => {
  return getImageUrl(path) || "https://i.pravatar.cc/150";
};

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
  timeout: 15000,
});

/**
 * Request interceptor:
 * - Adds Authorization header from secure storage
 * - Sets Content-Type to JSON for non-FormData requests
 * - Cleans payload: removes undefined/null values before sending
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Auth token
    try {
      const token = await storage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("[apiClient] Error retrieving token:", error);
    }

    // 2. Default Content-Type to JSON if not present
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    // 3. Clean payload — remove undefined/null fields
    if (
      config.data &&
      typeof config.data === "object" &&
      !Array.isArray(config.data)
    ) {
      config.data = Object.fromEntries(
        Object.entries(config.data).filter(
          ([_, v]) => v !== undefined && v !== null,
        ),
      );
    }

    console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor:
 * - Unwraps { success, data, message } pattern from backend
 * - Handles 401 → auto-logout
 * - Throws readable error messages from backend responses
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API] Response: ${response.config.method?.toUpperCase()} ${response.config.url} [${response.status}]`);
    // If backend wraps response in { success, data }, unwrap it
    const body = response.data;
    if (body && typeof body === "object" && "success" in body) {
      if (!body.success) {
        const errorMsg = body.message || "Error desconocido del servidor";
        return Promise.reject(new Error(errorMsg));
      }
      // Return the unwrapped data if present, otherwise the full body
      response.data = body.data !== undefined ? body.data : body;
    }
    return response;
  },
  async (error: AxiosError) => {
    const url = error.config?.url || "unknown";
    const method = error.config?.method?.toUpperCase() || "?";
    console.log(`[API ERROR]: ${method} ${url}`, error.message);

    if (error.response) {
      console.log(`[API ERROR RESPONSE]:`, error.response.status, error.response.data);

      // 401 — token expired or invalid → auto-logout
      if (error.response.status === 401) {
        await storage.removeItem("auth_token");
        if (onUnauthorized) {
          onUnauthorized();
        }
        return Promise.reject(
          new Error("Sesión expirada. Inicia sesión nuevamente."),
        );
      }

      const data = error.response.data as any;
      const message =
        data?.message ||
        data?.title ||
        (typeof data === "string" ? data : null) ||
        `Error ${error.response.status}`;
      return Promise.reject(new Error(message));
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new Error("La solicitud tardó demasiado. Revisa tu conexión."),
      );
    }

    return Promise.reject(
      new Error("Servidor no disponible"),
    );
  },
);

export default apiClient;
