import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutRoutine, UserProfile } from '../types';
import apiClient from '../api/apiClient';

const KEYS = {
    USER_PROFILE: 'user_profile',
    WORKOUT_LOGS: 'workout_logs',
    ROUTINES: 'routines',
    STREAK: 'streak',
    DEFAULTS_SEEDED: 'defaults_seeded',
    WEEKLY_PLAN: 'weekly_plan'
};

export const saveUserProfile = async (profile: UserProfile) => {
    try {
        await apiClient.put('/profile', {
            fullName: profile.name,
            bio: profile.bio,
            weight: profile.weight,
            height: profile.height,
            themePreference: profile.theme,
            languagePreference: profile.language
        });
        // Update local cache
        await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
        console.error('Failed to save profile', e);
    }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
    try {
        const response = await apiClient.get('/user/me');
        const userData = response.data;

        // Map backend DTO to frontend UserProfile
        const profile: UserProfile = {
            id: userData.id || 'unknown-id',
            name: userData.fullName || 'User',
            email: userData.email || 'user@example.com',
            bio: userData.bio || 'Fitness enthusiast',
            theme: userData.themePreference || 'Clean Blue',
            language: userData.languagePreference || 'es',
            avatarUrl: userData.avatarUrl || 'https://i.pravatar.cc/150?img=12',
            profileImage: userData.avatarUrl || null,
            height: userData.height || 0,
            weight: userData.weight || 0,
            streak: userData.streak || 0,
            stats: {
                workoutsCompleted: 0,
                minutesTrained: 0,
                streakDays: userData.streak || 0,
                weightLifted: 0
            },
            weeklyWorkoutGoal: 4,
            lastGoalChange: null
        };

        // Update local cache
        await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
        return profile;
    } catch (e) {
        console.error('Failed to fetch profile from API, trying local cache', e);
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.USER_PROFILE);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (localError) {
            return null;
        }
    }
};

export const saveRoutine = async (routine: WorkoutRoutine) => {
    try {
        // Prepare DTO
        const dto = {
            name: routine.name,
            description: routine.description,
            tags: routine.tags || [],
            durationSeconds: routine.duration || 3600, // Default estimate
            exercises: routine.exercises.map((ex, i) => ({
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                orderIndex: i,
                sets: ex.sets.map(s => ({
                    reps: s.reps,
                    weight: s.weight
                }))
            }))
        };

        await apiClient.post('/routines', dto);
        // Refresh done by caller usually, or we could return the new routine
    } catch (e) {
        console.error('Failed to save routine', e);
    }
};
// Helper to map status
const mapStatus = (s: number | string): any => {
    if (typeof s === 'string') return s;
    // Map backend int status to frontend string if needed, 
    // assuming backend 0=Pending, 1=Completed, etc.
    // For now, if we receive int, we might need a map.
    // Let's assume backend returns "Completed" string via enum converter.
    return s;
};

export const getRoutines = async (): Promise<WorkoutRoutine[]> => {
    try {
        const response = await apiClient.get('/routines');
        // Map backend DTO to frontend WorkoutRoutine
        const routines: WorkoutRoutine[] = response.data.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            tags: r.tags,
            isFavorite: r.isFavorite,
            date: r.date,
            duration: r.durationSeconds,
            status: 'planned',
            exercises: r.exercises.map((ex: any) => ({
                id: ex.id,
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                sets: ex.sets.map((s: any) => ({
                    id: s.id,
                    reps: s.reps,
                    weight: s.weight,
                    status: 'pending' // Default when loading template
                }))
            }))
        }));
        return routines;
    } catch (e) {
        console.error('Failed to fetch routines from API', e);
        return [];
    }
};

export const deleteRoutine = async (id: string) => {
    try {
        await apiClient.delete(`/routines/${id}`);
    } catch (e) {
        console.error('Failed to delete routine', e);
    }
};

export const saveWorkoutLog = async (log: WorkoutRoutine) => {
    try {
        // Map frontend log to Backend DTO
        const dto = {
            name: log.name,
            date: log.date,
            durationSeconds: log.duration,
            status: 0, // 0 = Completed (assuming enum)
            sensation: 0, // Map string to int if needed (Great=5, etc.). For now sending 0.
            description: log.notes || '',
            exercises: log.exercises.map((ex, i) => ({
                name: ex.name,
                muscleGroup: ex.muscleGroup || 'General',
                orderIndex: i,
                sets: ex.sets.map(s => ({
                    reps: s.reps,
                    weight: s.weight,
                    isCompleted: s.status === 'completed'
                }))
            }))
        };

        await apiClient.post('/workouts', dto);
        console.log('Workout synced to API');
    } catch (e) {
        console.error('Failed to save workout log', e);
    }
};

export const getWorkoutLogs = async (): Promise<WorkoutRoutine[]> => {
    try {
        const response = await apiClient.get('/workouts');
        // Map Backend DTO to Frontend
        return response.data.map((w: any) => ({
            id: w.id,
            name: w.name,
            date: w.date,
            duration: w.durationSeconds,
            status: 'completed',
            exercises: w.exercises.map((ex: any) => ({
                id: ex.id,
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                sets: ex.sets.map((s: any) => ({
                    id: s.id,
                    reps: s.reps,
                    weight: s.weight,
                    status: s.status // Assuming backend returns string enum now or we map it
                }))
            }))
        }));
    } catch (e) {
        console.error('Failed to fetch workout logs', e);
        return [];
    }
};
export const clearAllData = async () => {
    try {
        await AsyncStorage.multiRemove(Object.values(KEYS));
        // Also clear the seeded flag to allow re-seeding defaults
        await AsyncStorage.removeItem(KEYS.DEFAULTS_SEEDED);
    } catch (e) {
        console.error('Failed to clear data', e);
    }
};

export const getWeeklyPlan = async () => {
    try {
        const response = await apiClient.get('/weekly-plan');
        const plan = response.data;
        // Update local cache
        await AsyncStorage.setItem(KEYS.WEEKLY_PLAN, JSON.stringify(plan));
        return plan;
    } catch (e) {
        console.error('Failed to fetch weekly plan from API, trying local cache', e);
        try {
            const jsonPlan = await AsyncStorage.getItem(KEYS.WEEKLY_PLAN);
            return jsonPlan ? JSON.parse(jsonPlan) : {};
        } catch (localError) {
            return {};
        }
    }
};

export const saveWeeklyPlan = async (plan: Record<string, string | null>) => {
    try {
        await apiClient.put('/weekly-plan', plan);
        // Update local cache
        await AsyncStorage.setItem(KEYS.WEEKLY_PLAN, JSON.stringify(plan));
    } catch (e) {
        console.error('Failed to save weekly plan to API, saving locally', e);
        await AsyncStorage.setItem(KEYS.WEEKLY_PLAN, JSON.stringify(plan));
    }
};
