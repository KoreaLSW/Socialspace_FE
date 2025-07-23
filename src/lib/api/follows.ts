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
    const response = await expressApi.get(
      `/auth/follow/status/${targetUserId}`
    );
    return response.data;
  },

  // 팔로우/언팔로우
  toggleFollow: async (targetUserId: string): Promise<FollowResponse> => {
    const response = await expressApi.post(`/auth/follow/${targetUserId}`);
    return response.data;
  },

  // 친한친구 추가/제거
  toggleFavorite: async (targetUserId: string): Promise<FollowResponse> => {
    const response = await expressApi.post(`/auth/favorite/${targetUserId}`);
    return response.data;
  },

  // 차단하기/차단해제
  toggleBlock: async (targetUserId: string): Promise<FollowResponse> => {
    const response = await expressApi.post(`/auth/block/${targetUserId}`);
    return response.data;
  },
};
