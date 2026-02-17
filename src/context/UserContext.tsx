import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, LoginRequest, LoginResponse } from '../services/authService';

interface UserStats {
    workoutsCompleted: number;
    minutesTrained: number;
    streakDays: number;
    weightLifted: number;
}

export interface UserProfile {
    name: string;
    email: string;
    bio: string;
    profileImage: string | null;
    stats: UserStats;
    weeklyWorkoutGoal: number;
    lastGoalChange: string | null;
}

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
    const [user, setUser] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from storage on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user_profile');
                const storedToken = await AsyncStorage.getItem('user_token');

                if (storedUser && storedToken) {
                    setUser(JSON.parse(storedUser));
                    setToken(storedToken);
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
            const { token, username, email } = response;

            const newUser: UserProfile = {
                name: username,
                email: email,
                bio: 'Fitness enthusiast', // Default bio
                profileImage: null,
                stats: defaultStats,
                weeklyWorkoutGoal: 4,
                lastGoalChange: null
            };

            setUser(newUser);
            setToken(token);

            await AsyncStorage.setItem('user_profile', JSON.stringify(newUser));
            await AsyncStorage.setItem('user_token', token);
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
