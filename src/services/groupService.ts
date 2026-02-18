import apiClient from '../api/apiClient';

export interface Group {
    id: string;
    name: string;
    description: string;
    streak: number;
    memberCount: number;
    activityLevel: string;
    isUserMember: boolean;
    color?: string; // Optional for UI
    icon?: string; // Optional for UI
}

export const getGroups = async (): Promise<Group[]> => {
    try {
        const response = await apiClient.get('/groups');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch groups', error);
        return [];
    }
};

export const createGroup = async (name: string, description: string) => {
    try {
        // Backend expects { name, description }
        const response = await apiClient.post('/groups', { name, description });
        return response.data;
    } catch (error) {
        console.error('Failed to create group', error);
        throw error;
    }
};

export const joinGroup = async (groupId: string) => {
    try {
        await apiClient.post(`/groups/${groupId}/join`);
    } catch (error) {
        console.error('Failed to join group', error);
        throw error;
    }
};

export const leaveGroup = async (groupId: string) => {
    try {
        await apiClient.post(`/groups/${groupId}/leave`);
    } catch (error) {
        console.error('Failed to leave group', error);
        throw error;
    }
};

export const getUserGroups = async (): Promise<Group[]> => {
    try {
        const response = await apiClient.get('/groups');
        // Filter locally or backend endpoint? Backend /groups returns all?
        // Let's assume /groups returns what we need or we filter.
        // Actually, looking at backend controller, GET /api/groups returns all groups.
        // We might need a separate endpoint for "My Groups" or filter client side.
        // For now, return all and let UI filter by isUserMember
        return response.data.filter((g: Group) => g.isUserMember);
    } catch (error) {
        console.error('Failed to fetch user groups', error);
        return [];
    }
};
