import { Platform } from 'react-native';

export const shadows = {
    sm: Platform.select({
        web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.08)' },
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 }
    }),
    md: Platform.select({
        web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' },
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5 }
    }),
    lg: Platform.select({
        web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.16)' },
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 }
    }),
    xl: Platform.select({
        web: { boxShadow: '0px 12px 32px rgba(0,0,0,0.24)' },
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.24, shadowRadius: 32, elevation: 15 }
    }),
};
