import apiClient from '../api/apiClient';
import { UserProfile } from '../types';

export const searchUsers = async (query: string): Promise<UserProfile[]> => {
    try {
        if (!query.trim()) return [];
        const response = await apiClient.get(`/user/search?name=${encodeURIComponent(query)}`);

        // Map DTO to UserProfile (or a subset of it)
        return response.data.map((u: any) => ({
            id: u.id,
            name: u.fullName,
            email: u.email,
            theme: u.theme,
            language: u.language,
            height: u.height,
            weight: u.weight,
            streak: u.streak,
            profileImage: u.avatarUrl || null,
            // Provide defaults for missing fields from search DTO
            bio: '',
            avatarUrl: u.avatarUrl || 'https://i.pravatar.cc/150?img=12',
            stats: { workoutsCompleted: 0, minutesTrained: 0, streakDays: u.streak, weightLifted: 0 },
            weeklyWorkoutGoal: 4,
            lastGoalChange: null
        }));
    } catch (error) {
        console.error('Failed to search users:', error);
        return [];
    }
};
