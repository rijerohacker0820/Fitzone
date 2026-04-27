import apiClient from "../api/apiClient";

export interface Group {
  id: string;
  name: string;
  description: string;
  streak: number;
  memberCount: number;
  activityLevel: string;
  isUserMember: boolean;
  isPublic?: boolean;
  imageUrl?: string;
  adminUserId?: string;
  color?: string; // Optional for UI
  icon?: string; // Optional for UI
}

export interface GroupMember {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

export const getGroups = async (): Promise<Group[]> => {
  try {
    const response = await apiClient.get("/groups");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch groups", error);
    return [];
  }
};

export const getPublicGroups = async (): Promise<Group[]> => {
  try {
    const response = await apiClient.get("/groups/public");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch public groups", error);
    return [];
  }
};

export const createGroup = async (
  name: string,
  description: string,
  activityLevel: string = "Medio",
) => {
  try {
    const response = await apiClient.post("/groups", {
      name,
      description,
      activityLevel,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create group", error);
    throw error;
  }
};

export const getMyGroups = async () => {
  const response = await apiClient.get("/groups/my-groups");
  return response.data;
};

export const getGroupMembers = async (
  groupId: string,
): Promise<GroupMember[]> => {
  const response = await apiClient.get(`/groups/${groupId}/members`);
  return response.data;
};

export const joinGroup = async (groupId: string) => {
  try {
    await apiClient.post(`/groups/${groupId}/join`);
  } catch (error) {
    console.error("Failed to join group", error);
    throw error;
  }
};

export const addMemberToGroup = async (groupId: string, userId: string) => {
  try {
    const response = await apiClient.post(
      `/groups/${groupId}/members/${userId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error("Failed to add member to group", error);
    throw error;
  }
};

export const leaveGroup = async (groupId: string) => {
  try {
    await apiClient.post(`/groups/${groupId}/leave`);
  } catch (error) {
    console.error("Failed to leave group", error);
    throw error;
  }
};

export const removeMemberFromGroup = async (
  groupId: string,
  userId: string,
) => {
  try {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  } catch (error) {
    console.error("Failed to remove member", error);
    throw error;
  }
};

export const updateGroup = async (
  groupId: string,
  updates: {
    name?: string;
    description?: string;
    activityLevel?: string;
    imageUrl?: string;
    isPublic?: boolean;
  },
) => {
  const response = await apiClient.put(`/groups/${groupId}`, updates);
  return response.data;
};

export const sendAdvancedMessage = async (
  groupId: string,
  payload: {
    content: string;
    imageUrl?: string;
    messageType: string; // text | image | routine | exercise
  },
) => {
  const response = await apiClient.post(`/groups/${groupId}/messages`, payload);
  return response.data;
};

export const getUserGroups = async (): Promise<Group[]> => {
  try {
    const response = await apiClient.get("/groups");
    return response.data.filter((g: Group) => g.isUserMember);
  } catch (error) {
    console.error("Failed to fetch user groups", error);
    return [];
  }
};
