import { expressApi } from "./config";

export interface BlockedUser {
  id: string;
  username: string;
  nickname: string;
  profile_image?: string;
  blocked_since: string;
  followers_count: number;
}

export interface BlockedUsersResponse {
  success: boolean;
  data: BlockedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BlockResponse {
  success: boolean;
  message: string;
  data: {
    isBlocked: boolean;
  };
}

export const blocksApi = {
  // 차단하기/차단해제
  toggleBlock: async (targetUserId: string): Promise<BlockResponse> => {
    const response = await expressApi.post(`/follow/block/${targetUserId}`);
    return response.data;
  },

  // 차단된 사용자 목록 조회
  getBlockedUsers: async (
    page: number = 1,
    limit: number = 20
  ): Promise<BlockedUsersResponse> => {
    const response = await expressApi.get(
      `/auth/blocked-users?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};
