import { Platform } from "react-native";

/**
 * Centralized environment configuration.
 * Reads from app.json extra or falls back to defaults.
 * All URLs and feature flags are managed here — no hardcodes elsewhere.
 */

const API_URL_PRODUCTION = "http://Fitzone-Development.somee.com/api";
const API_URL_LOCAL_ANDROID = "http://10.0.2.2:5062/api";
const API_URL_LOCAL_IOS = "http://localhost:5062/api";

// Toggle: set to false for local development
const USE_PRODUCTION = false;

function getLocalUrl(): string {
  return Platform.OS === "android" ? API_URL_LOCAL_ANDROID : API_URL_LOCAL_IOS;
}

export const ENV = {
  API_URL: USE_PRODUCTION ? API_URL_PRODUCTION : getLocalUrl(),
  USE_PRODUCTION,
} as const;
