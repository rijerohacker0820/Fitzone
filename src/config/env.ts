import { Platform } from "react-native";

/**
 * Environment configuration for API endpoints.
 * Detects platform and supports manual IP for physical devices.
 */

// 🔴 PRODUCCIÓN (solo cuando despliegues)
const API_URL_PRODUCTION = "http://Fitzone-Development.somee.com/api";

// 🟢 DESARROLLO
const USE_PRODUCTION = false; // Cambia esto a true solo cuando quieras usar backend online

const MANUAL_IP = "192.168.100.16";
const USE_MANUAL_IP = true; // true = dispositivo físico, false = emulador

function getLocalUrl(): string {
  if (USE_MANUAL_IP) {
    return `http://${MANUAL_IP}:5062/api`;
  }
  // Emulador Android usa 10.0.2.2, iOS usa localhost
  // NO usar localhost en Android
  return Platform.OS === "android"
    ? "http://10.0.2.2:5062/api"
    : "http://localhost:5062/api";
}

export const ENV = {
  API_URL: USE_PRODUCTION ? API_URL_PRODUCTION : getLocalUrl(),
  USE_PRODUCTION,
} as const;