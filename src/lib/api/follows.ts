import { expressApi } from "./config";

export interface FollowStatus {
  isFollowing: boolean;
  isFavorite: boolean;
  isBlocked: boolean;
}

export interface FollowResponse {
  success: boolean;
  message?: string;
  data:
    | FollowStatus
    | { isFollowing: boolean }
    | { isFavorite: boolean }
    | { isBlocked: boolean };
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
};
