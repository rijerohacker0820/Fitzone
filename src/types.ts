export type ProfileTheme = 'Electric Blue' | 'Lush Green' | 'Crimson Pulse' | 'Golden Hour' | 'Royal Purple' | 'Obsidian' | 'Clean Blue';

export type Language = 'en' | 'es' | 'fr';

export interface UserStats {
    workoutsCompleted: number;
    minutesTrained: number;
    streakDays: number;
    weightLifted: number;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    bio: string;
    profileImage: string | null;
    theme: ProfileTheme;
    language: Language;
    avatarUrl: string;
    height: number; // cm
    weight: number; // kg
    streak: number;
    stats: UserStats;
    weeklyWorkoutGoal: number;
    lastGoalChange: string | null;
}

export type SetStatus = 'completed' | 'partial' | 'failed' | 'pending';

export interface WorkoutSet {
    id: string;
    reps: number;
    weight: number; // kg
    status: SetStatus;
}

export interface Exercise {
    id: string;
    name: string;
    sets: WorkoutSet[];
    muscleGroup: string;
}

export interface WorkoutRoutine {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    tags?: string[];
    isFavorite?: boolean;
    exercises: Exercise[];
    date: string; // ISO
    duration: number; // seconds
    status: 'completed' | 'in-progress' | 'planned';
    sensation?: 'Great' | 'Good' | 'Neutral' | 'Hard' | 'Exhausted';
    notes?: string;
    imageUri?: string;
}

export interface ACWRData {
    date: string;
    acuteLoad: number;
    chronicLoad: number;
    ratio: number;
    status: 'Optimal' | 'Fatigue Risk' | 'Recovery';
}
