/**
 * Fitzone Premium Design Tokens
 * Inspired by Nike Training Club / Strava / Apple Fitness
 *
 * Brand palette extracted from logo_variaciones_paleta.png
 */

export const themes = {
    'Electric Blue': {
        primary: '#00F0FF',
        secondary: '#007A82',
        background: '#0D0D0D',
        card: '#1A1A1A',
        text: '#FFFFFF',
        textSecondary: '#A1A1AA',
        accent: '#00F0FF',
        border: '#2A2A2A',
        success: '#00D68F',
        error: '#FF3D71',
        warning: '#FFAA00',
    },
    'Lush Green': {
        primary: '#00FF94',
        secondary: '#00854D',
        background: '#051A10',
        card: '#0D261A',
        text: '#E0FFE0',
        textSecondary: '#8FB399',
        accent: '#00FF94',
        border: '#1A3D2A',
        success: '#00D68F',
        error: '#FF3D71',
        warning: '#FFAA00',
    },
    'Crimson Pulse': {
        primary: '#FF2E4D',
        secondary: '#8F0014',
        background: '#1A0508',
        card: '#2E0D12',
        text: '#FFE0E5',
        textSecondary: '#B38085',
        accent: '#FF2E4D',
        border: '#4D1A22',
        success: '#00D68F',
        error: '#FF3D71',
        warning: '#FFAA00',
    },
    'Golden Hour': {
        primary: '#FFD700',
        secondary: '#B38600',
        background: '#1A1400',
        card: '#332900',
        text: '#FFFBE0',
        textSecondary: '#B3AC80',
        accent: '#FFD700',
        border: '#4D3E00',
        success: '#00D68F',
        error: '#FF3D71',
        warning: '#FFAA00',
    },
    'Royal Purple': {
        primary: '#bf00ff',
        secondary: '#66008F',
        background: '#0F001A',
        card: '#1F0033',
        text: '#F2E0FF',
        textSecondary: '#A680B3',
        accent: '#bf00ff',
        border: '#3D004D',
        success: '#00D68F',
        error: '#FF3D71',
        warning: '#FFAA00',
    },
    'Obsidian': {
        primary: '#EDEDED',
        secondary: '#4D4D4D',
        background: '#000000',
        card: '#121212',
        text: '#FFFFFF',
        textSecondary: '#666666',
        accent: '#EDEDED',
        border: '#2A2A2A',
        success: '#00D68F',
        error: '#FF3D71',
        warning: '#FFAA00',
    },
    'Clean Blue': {
        primary: '#2563EB',
        secondary: '#3B82F6',
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: '#0F172A',
        textSecondary: '#64748B',
        accent: '#2563EB',
        border: '#E2E8F0',
        success: '#059669',
        error: '#DC2626',
        warning: '#D97706',
    },
};

/**
 * Fitzone brand colors — extracted from logo_variaciones_paleta.png
 */
export const BRAND = {
    orange: '#F97316',
    orangeDark: '#EA580C',
    orangeLight: '#FB923C',
    dark: '#0F0F0F',
    darkCard: '#1A1A1A',
    white: '#FFFFFF',
    gray: '#6B7280',
    grayLight: '#9CA3AF',
    grayDark: '#374151',
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
    sm: '0px 1px 3px rgba(0,0,0,0.08)',
    md: '0px 4px 12px rgba(0,0,0,0.12)',
    lg: '0px 8px 24px rgba(0,0,0,0.16)',
    xl: '0px 12px 32px rgba(0,0,0,0.24)',
    glow: (color: string) => `0px 0px 20px ${color}33`,
} as const;
