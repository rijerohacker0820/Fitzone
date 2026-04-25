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
    followersCount?: number;
    followingCount?: number;
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
    notes?: string;
    restSeconds?: number;
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
    restSeconds?: number;
}

export interface ACWRData {
    date: string;
    acuteLoad: number;
    chronicLoad: number;
    ratio: number;
    status: 'Optimal' | 'Fatigue Risk' | 'Recovery';
}

// ─── Social: Friends ───────────────────────────────────

export interface FriendDto {
    friendshipId: string;
    userId: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    streak: number;
    status: 'Pending' | 'Accepted';
    isRequester: boolean;
    since: string;
}

export interface FriendSearchResult {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    streak: number;
    friendshipStatus: string | null; // null | "Pending" | "Accepted"
    isFollowing: boolean;
}

// ─── Social: Follow ────────────────────────────────────

export interface FollowerInfo {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    streak: number;
    followedSince: string;
}

// ─── Social: Posts ──────────────────────────────────────

export interface PostWorkoutSummary {
    workoutId: string;
    name: string;
    durationSeconds: number;
    exerciseCount: number;
    totalSets: number;
}

export interface PostComment {
    id: string;
    userId: string;
    userFullName: string;
    userAvatarUrl: string | null;
    content: string;
    createdAt: string;
}

export interface Post {
    id: string;
    userId: string;
    userFullName: string;
    userAvatarUrl: string | null;
    content: string;
    imageUrl: string | null;
    type: string; // Text, Image, Workout, Achievement
    createdAt: string;
    workoutSummary: PostWorkoutSummary | null;
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
    recentComments: PostComment[];
}

export interface PostCreatePayload {
    content: string;
    imageUrl?: string;
    workoutId?: string;
    type: string;
}

// ─── Analytics ─────────────────────────────────────────

export interface ProgressEntry {
    date: string;
    maxWeight: number;
    maxReps: number;
    estimatedOneRepMax: number;
    totalVolume: number;
}

export interface PersonalRecord {
    maxWeight: number;
    maxReps: number;
    estimatedOneRepMax: number;
    achievedAt: string;
    isNewPR: boolean;
}

export interface ExerciseProgress {
    exerciseName: string;
    muscleGroup: string;
    entries: ProgressEntry[];
    personalRecord: PersonalRecord | null;
}

export interface MuscleDistribution {
    muscleGroup: string;
    totalSets: number;
    totalVolume: number;
    percentage: number;
}

export interface PeriodSummary {
    startDate: string;
    endDate: string;
    workoutCount: number;
    totalVolume: number;
    totalDurationSeconds: number;
    averageSensation: number;
}

export interface HistoricalComparison {
    currentPeriod: PeriodSummary;
    previousPeriod: PeriodSummary;
    workoutCountChange: number;
    volumeChange: number;
    durationChange: number;
}
