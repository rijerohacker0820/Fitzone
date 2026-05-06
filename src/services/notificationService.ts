import apiClient from "../api/apiClient";

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string;
  imageUrl?: string;
}

export const getNotifications = async (): Promise<NotificationDto[]> => {
  const response = await apiClient.get("/notifications");
  return response.data;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await apiClient.put(`/notifications/${id}/read`);
};

export const getUnreadCount = async (): Promise<number> => {
  const notifications = await getNotifications();
  return notifications.filter((n) => !n.isRead).length;
};
