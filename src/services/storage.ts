import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutRoutine, UserProfile } from '../types';

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
        await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
        console.error('Failed to save profile', e);
    }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(KEYS.USER_PROFILE);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error('Failed to fetch profile', e);
        return null;
    }
};

export const saveRoutine = async (routine: WorkoutRoutine) => {
    try {
        const existing = await getRoutines();
        const index = existing.findIndex(r => r.id === routine.id);
        let updated;
        if (index !== -1) {
            updated = [...existing];
            updated[index] = routine;
        } else {
            updated = [...existing, routine];
        }
        await AsyncStorage.setItem(KEYS.ROUTINES, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save routine', e);
    }
};

const DEFAULT_ROUTINES: WorkoutRoutine[] = [
    {
        id: 'default-1',
        name: 'Full Body Ignite',
        description: 'A comprehensive full-body workout to jumpstart your fitness journey.',
        tags: ['Full Body', 'Beginner'],
        exercises: [
            {
                id: 'ex-1', name: 'Squat', muscleGroup: 'Legs', sets: [
                    { id: 's1', reps: 12, weight: 0, status: 'pending' },
                    { id: 's2', reps: 12, weight: 0, status: 'pending' },
                    { id: 's3', reps: 12, weight: 0, status: 'pending' }
                ]
            },
            {
                id: 'ex-2', name: 'Bench Press', muscleGroup: 'Chest', sets: [
                    { id: 's4', reps: 10, weight: 0, status: 'pending' },
                    { id: 's5', reps: 10, weight: 0, status: 'pending' },
                    { id: 's6', reps: 10, weight: 0, status: 'pending' }
                ]
            },
            {
                id: 'ex-3', name: 'Pull Up', muscleGroup: 'Back', sets: [
                    { id: 's7', reps: 8, weight: 0, status: 'pending' },
                    { id: 's8', reps: 8, weight: 0, status: 'pending' },
                    { id: 's9', reps: 8, weight: 0, status: 'pending' }
                ]
            }
        ],
        date: new Date().toISOString(),
        duration: 0,
        status: 'planned'
    },
    {
        id: 'default-2',
        name: 'Upper Body Power',
        description: 'Focused workout on strength and hypertrophy for the upper body.',
        tags: ['Upper Body', 'Strength'],
        exercises: [
            {
                id: 'ex-4', name: 'Overhead Press', muscleGroup: 'Shoulders', sets: [
                    { id: 's10', reps: 10, weight: 0, status: 'pending' },
                    { id: 's11', reps: 10, weight: 0, status: 'pending' },
                    { id: 's12', reps: 10, weight: 0, status: 'pending' }
                ]
            },
            {
                id: 'ex-5', name: 'Dumbbell Row', muscleGroup: 'Back', sets: [
                    { id: 's13', reps: 12, weight: 0, status: 'pending' },
                    { id: 's14', reps: 12, weight: 0, status: 'pending' },
                    { id: 's15', reps: 12, weight: 0, status: 'pending' }
                ]
            },
            {
                id: 'ex-6', name: 'Bicep Curl', muscleGroup: 'Arms', sets: [
                    { id: 's16', reps: 15, weight: 0, status: 'pending' },
                    { id: 's17', reps: 15, weight: 0, status: 'pending' },
                    { id: 's18', reps: 15, weight: 0, status: 'pending' }
                ]
            }
        ],
        date: new Date().toISOString(),
        duration: 0,
        status: 'planned'
    }
];

export const getRoutines = async (): Promise<WorkoutRoutine[]> => {
    try {
        const seeded = await AsyncStorage.getItem(KEYS.DEFAULTS_SEEDED);
        const jsonValue = await AsyncStorage.getItem(KEYS.ROUTINES);
        let currentRoutines: WorkoutRoutine[] = jsonValue != null ? JSON.parse(jsonValue) : [];

        if (seeded !== 'true') {
            // First time seeding or migration
            // Filter out defaults that might already exist by some chance
            const defaultsToAdd = DEFAULT_ROUTINES.filter(
                def => !currentRoutines.some(curr => curr.id === def.id)
            );

            if (defaultsToAdd.length > 0) {
                currentRoutines = [...currentRoutines, ...defaultsToAdd];
                await AsyncStorage.setItem(KEYS.ROUTINES, JSON.stringify(currentRoutines));
            }
            await AsyncStorage.setItem(KEYS.DEFAULTS_SEEDED, 'true');
        }

        return currentRoutines;
    } catch (e) {
        console.error('Failed to fetch routines', e);
        return [];
    }
};

export const deleteRoutine = async (id: string) => {
    try {
        const existing = await getRoutines();
        const updated = existing.filter(r => r.id !== id);
        await AsyncStorage.setItem(KEYS.ROUTINES, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to delete routine', e);
    }
};

export const saveWorkoutLog = async (log: WorkoutRoutine) => {
    try {
        const existing = await getWorkoutLogs();
        const updated = [...existing, log];
        await AsyncStorage.setItem(KEYS.WORKOUT_LOGS, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save workout log', e);
    }
};

export const getWorkoutLogs = async (): Promise<WorkoutRoutine[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(KEYS.WORKOUT_LOGS);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
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
        const jsonPlan = await AsyncStorage.getItem(KEYS.WEEKLY_PLAN);
        return jsonPlan ? JSON.parse(jsonPlan) : {};
    } catch (e) {
        console.error('Failed to load weekly plan', e);
        return {};
    }
};

export const saveWeeklyPlan = async (plan: Record<string, string | null>) => {
    try {
        await AsyncStorage.setItem(KEYS.WEEKLY_PLAN, JSON.stringify(plan));
    } catch (e) {
        console.error('Failed to save weekly plan', e);
    }
};
