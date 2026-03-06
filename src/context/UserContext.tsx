import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, LoginRequest, LoginResponse } from '../services/authService';
import { saveUserProfile, getUserProfile } from '../services/storage';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';

import { UserProfile, UserStats } from '../types';

interface UserContextType {
    user: UserProfile | null;
    token: string | null;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => void;
    updateStats: (newStats: Partial<UserStats>) => void;
}

const defaultStats: UserStats = {
    workoutsCompleted: 0,
    minutesTrained: 0,
    streakDays: 0,
    weightLifted: 0
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const { setLanguage } = useLanguage();
    const { setTheme } = useTheme();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from storage on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('user_token');

                if (storedToken) {
                    setToken(storedToken);
                    // Fetch real profile from API or Local Cache
                    const profile = await getUserProfile();
                    if (profile) {
                        setUser(profile);
                        if (profile.language) setLanguage(profile.language);
                        if (profile.theme) setTheme(profile.theme);
                    }
                }
            } catch (e) {
                console.error("Failed to load user profile", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (data: LoginRequest) => {
        setIsLoading(true);
        try {
            const response = await apiLogin(data);
            const { token } = response;

            setToken(token);
            await AsyncStorage.setItem('user_token', token);

            // Now correctly fetch the user profile from the database
            const profile = await getUserProfile();
            if (profile) {
                setUser(profile);
                if (profile.language) setLanguage(profile.language);
                if (profile.theme) setTheme(profile.theme);
            } else {
                throw new Error("Failed to load profile from server");
            }
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        await AsyncStorage.removeItem('user_profile');
        await AsyncStorage.removeItem('user_token');
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return;

        const newUser = { ...user, ...updates };
        setUser(newUser);
        try {
            await saveUserProfile(newUser); // Save to API
            await AsyncStorage.setItem('user_profile', JSON.stringify(newUser));
        } catch (e) {
            console.error("Failed to save user profile", e);
        }
    };

    const updateStats = async (newStats: Partial<UserStats>) => {
        if (!user) return;
        const updatedStats = { ...user.stats, ...newStats };
        updateProfile({ stats: updatedStats });
    };

    return (
        <UserContext.Provider value={{ user, token, isLoading, login, logout, updateProfile, updateStats }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
