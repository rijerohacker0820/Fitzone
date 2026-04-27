import apiClient from "../api/apiClient";
import {
  FriendDto,
  FriendSearchResult,
  FollowerInfo,
  Post,
  PostCreatePayload,
  PostComment,
} from "../types";

// ─── Friends API ───────────────────────────────────────

export const getFriends = async (): Promise<FriendDto[]> => {
  const response = await apiClient.get("/friends");
  return response.data;
};

export const searchFriends = async (
  name: string,
): Promise<FriendSearchResult[]> => {
  if (!name.trim()) return [];
  const response = await apiClient.get(
    `/friends/search?name=${encodeURIComponent(name)}`,
  );
  return response.data;
};

export const sendFriendRequest = async (addresseeId: string): Promise<any> => {
  const response = await apiClient.post("/friends/request", { addresseeId });
  return response.data;
};

export const acceptFriendRequest = async (
  friendshipId: string,
): Promise<any> => {
  const response = await apiClient.post("/friends/accept", { friendshipId });
  return response.data;
};

export const rejectFriendRequest = async (
  friendshipId: string,
): Promise<void> => {
  await apiClient.post("/friends/reject", { friendshipId });
};

// ─── Follow API ────────────────────────────────────────

export const followUser = async (targetUserId: string): Promise<void> => {
  await apiClient.post("/follow", { targetUserId });
};

export const unfollowUser = async (targetUserId: string): Promise<void> => {
  await apiClient.post("/unfollow", { targetUserId });
};

export const getFollowers = async (): Promise<FollowerInfo[]> => {
  const response = await apiClient.get("/follow/followers");
  return response.data;
};

export const getFollowing = async (): Promise<FollowerInfo[]> => {
  const response = await apiClient.get("/follow/following");
  return response.data;
};

// ─── Posts API ─────────────────────────────────────────

export const getFeed = async (
  page: number = 1,
  pageSize: number = 20,
): Promise<Post[]> => {
  const response = await apiClient.get(
    `/posts/feed?page=${page}&pageSize=${pageSize}`,
  );
  return response.data;
};

export const createPost = async (payload: PostCreatePayload): Promise<Post> => {
  const response = await apiClient.post("/posts", payload);
  return response.data;
};

export const deletePost = async (postId: string): Promise<void> => {
  await apiClient.delete(`/posts/${postId}`);
};

export const toggleLike = async (
  postId: string,
): Promise<{ liked: boolean }> => {
  const response = await apiClient.post(`/posts/${postId}/like`);
  return response.data;
};

export const addComment = async (
  postId: string,
  content: string,
): Promise<PostComment> => {
  const response = await apiClient.post(`/posts/${postId}/comment`, {
    content,
  });
  return response.data;
};
