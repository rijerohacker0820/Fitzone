import { Platform } from 'react-native';

/**
 * Cross-platform secure storage wrapper.
 *
 * - Mobile (iOS/Android): uses expo-secure-store (encrypted keychain/keystore)
 * - Web: uses localStorage (SecureStore is not available on web)
 *
 * All token and sensitive data access should go through this module.
 * NEVER import expo-secure-store directly elsewhere.
 */

// We lazy-load SecureStore only on native to avoid web crashes
let SecureStore: typeof import('expo-secure-store') | null = null;

if (Platform.OS !== 'web') {
    SecureStore = require('expo-secure-store');
}

const storage = {
    async getItem(key: string): Promise<string | null> {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(key);
            }
            return await SecureStore!.getItemAsync(key);
        } catch (error) {
            console.error(`[secureStorage] getItem("${key}") failed:`, error);
            return null;
        }
    },

    async setItem(key: string, value: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(key, value);
                return;
            }
            await SecureStore!.setItemAsync(key, value);
        } catch (error) {
            console.error(`[secureStorage] setItem("${key}") failed:`, error);
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(key);
                return;
            }
            await SecureStore!.deleteItemAsync(key);
        } catch (error) {
            console.error(`[secureStorage] removeItem("${key}") failed:`, error);
        }
    },
};

export default storage;
