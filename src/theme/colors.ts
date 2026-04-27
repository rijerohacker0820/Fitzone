/**
 * Fitzone Premium Design Tokens
 * Inspired by Nike Training Club / Strava / Apple Fitness
 *
 * Brand palette extracted from logo_variaciones_paleta.png
 */

export const themes = {
  "Premium Fitzone": {
    primary: "#49b8bf",
    secondary: "#1a45b8",
    background: "#050f2a",
    card: "#0a1a3a", // surface
    surface: "#0a1a3a",
    text: "#ffffff",
    textPrimary: "#ffffff",
    textSecondary: "#777777",
    accent: "#49b8bf",
    border: "#1a45b8",
    success: "#00D68F",
    error: "#FF3D71",
    warning: "#FFAA00",
  },
  // Keep Clean Blue as fallback just in case types fail temporarily, though we'll switch default
  "Clean Blue": {
    primary: "#49b8bf",
    secondary: "#1a45b8",
    background: "#050f2a",
    card: "#0a1a3a",
    surface: "#0a1a3a",
    text: "#ffffff",
    textPrimary: "#ffffff",
    textSecondary: "#777777",
    accent: "#49b8bf",
    border: "#1a45b8",
    success: "#00D68F",
    error: "#FF3D71",
    warning: "#FFAA00",
  },
};

/**
 * Fitzone brand colors — extracted from logo_variaciones_paleta.png
 */
export const BRAND = {
  orange: "#F97316",
  orangeDark: "#EA580C",
  orangeLight: "#FB923C",
  dark: "#0F0F0F",
  darkCard: "#1A1A1A",
  white: "#FFFFFF",
  gray: "#6B7280",
  grayLight: "#9CA3AF",
  grayDark: "#374151",
};

/**
 * Premium spacing scale (8pt grid)
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Premium border radius
 */
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

/**
 * Premium box shadows (web-compatible)
 */
export const SHADOWS = {
  sm: "0px 1px 3px rgba(0,0,0,0.08)",
  md: "0px 4px 12px rgba(0,0,0,0.12)",
  lg: "0px 8px 24px rgba(0,0,0,0.16)",
  xl: "0px 12px 32px rgba(0,0,0,0.24)",
  glow: (color: string) => `0px 0px 20px ${color}33`,
} as const;
