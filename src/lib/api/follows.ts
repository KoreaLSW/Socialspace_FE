import { expressApi } from "./config";

export interface FollowStatus {
  isFollowing: boolean;
  isPending?: boolean;
  isFavorite: boolean;
  isBlocked: boolean;
}

export interface FollowResponse {
  success: boolean;
  message?: string;
  data:
    | FollowStatus
    | { isFollowing: boolean; isPending?: boolean }
    | { isFavorite: boolean }
    | { isBlocked: boolean };
}

export interface FavoriteUser {
  id: string;
  username: string;
  nickname: string;
  profile_image?: string;
  favorite_since: string;
  followers_count: number;
}

export interface FavoritesResponse {
  success: boolean;
  data: FavoriteUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const followApi = {
  // 팔로우 상태 확인
  checkFollowStatus: async (
    targetUserId: string
  ): Promise<{ success: boolean; data: FollowStatus }> => {
    const response = await expressApi.get(`/follow/status/${targetUserId}`);
    return response.data;
  },

  // 팔로우/언팔로우
  toggleFollow: async (targetUserId: string): Promise<FollowResponse> => {
    const response = await expressApi.post(`/follow/${targetUserId}`);
    return response.data;
  },

  // 친한친구 추가/제거
  toggleFavorite: async (targetUserId: string): Promise<FollowResponse> => {
    const response = await expressApi.post(`/follow/favorite/${targetUserId}`);
    return response.data;
  },

  // 차단하기/차단해제
  toggleBlock: async (targetUserId: string): Promise<FollowResponse> => {
    const response = await expressApi.post(`/follow/block/${targetUserId}`);
    return response.data;
  },

  // 팔로워 목록
  getFollowers: async (
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; data: any[]; pagination?: any }> => {
    const response = await expressApi.get(
      `/follow/followers/${userId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // 팔로잉 목록
  getFollowing: async (
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; data: any[]; pagination?: any }> => {
    const response = await expressApi.get(
      `/follow/following/${userId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },
  // 게시글 좋아요 사용자 목록
  getPostLikes: async (
    postId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ success: boolean; data: any[]; pagination?: any }> => {
    const response = await expressApi.get(
      `/posts/${postId}/likes?page=${page}&limit=${limit}`
    );
    return response.data;
  },
  // 댓글 좋아요 사용자 목록
  getCommentLikes: async (
    commentId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ success: boolean; data: any[]; pagination?: any }> => {
    const response = await expressApi.get(
      `/comments/${commentId}/likes?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // 친한친구 목록 조회
  getFavorites: async (
    page: number = 1,
    limit: number = 20
  ): Promise<FavoritesResponse> => {
    const response = await expressApi.get(
      `/auth/favorites?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // 팔로우 요청 목록 조회
  getFollowRequests: async (
    page: number = 1,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      username: string;
      nickname: string;
      profile_image?: string;
      followers_count: number;
      requested_at: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await expressApi.get(
      `/auth/follow-requests?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // 팔로우 요청 승인
  approveFollowRequest: async (
    requesterId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await expressApi.post(
      `/auth/follow-requests/${requesterId}/approve`
    );
    return response.data;
  },

  // 팔로우 요청 거절
  rejectFollowRequest: async (
    requesterId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await expressApi.post(
      `/auth/follow-requests/${requesterId}/reject`
    );
    return response.data;
  },

  // 맞팔로우 목록 조회
  getMutualFollows: async (
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; data: any[]; pagination?: any }> => {
    const response = await expressApi.get(
      `/follow/mutual-follows/${userId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};
