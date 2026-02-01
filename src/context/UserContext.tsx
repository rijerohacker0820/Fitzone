import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStats {
    workoutsCompleted: number;
    minutesTrained: number;
    streakDays: number;
    weightLifted: number;
}

interface UserProfile {
    name: string;
    email: string;
    bio: string;
    profileImage: string | null;
    stats: UserStats;
    weeklyWorkoutGoal: number;
    lastGoalChange: string | null;
}

interface UserContextType {
    user: UserProfile;
    updateProfile: (updates: Partial<UserProfile>) => void;
    updateStats: (newStats: Partial<UserStats>) => void;
}

const defaultUser: UserProfile = {
    name: 'Alex Johnson',
    email: 'alex.fit@example.com',
    bio: 'Fitness enthusiast & weekend warrior 💪',
    profileImage: null,
    stats: {
        workoutsCompleted: 42,
        minutesTrained: 1250,
        streakDays: 12,
        weightLifted: 15400
    },
    weeklyWorkoutGoal: 4,
    lastGoalChange: null
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile>(defaultUser);

    // Load from storage on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user_profile');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error("Failed to load user profile", e);
            }
        };
        loadUser();
    }, []);

    const updateProfile = async (updates: Partial<UserProfile>) => {
        const newUser = { ...user, ...updates };
        setUser(newUser);
        try {
            await AsyncStorage.setItem('user_profile', JSON.stringify(newUser));
        } catch (e) {
            console.error("Failed to save user profile", e);
        }
    };

    const updateStats = async (newStats: Partial<UserStats>) => {
        const updatedStats = { ...user.stats, ...newStats };
        updateProfile({ stats: updatedStats });
    };

    return (
        <UserContext.Provider value={{ user, updateProfile, updateStats }}>
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
