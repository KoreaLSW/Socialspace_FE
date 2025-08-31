import { expressApi } from "./config";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  nickname: string;
  bio?: string;
  profileImage?: string;
  visibility: string;
  followApprovalMode?: string;
  showMutualFollow?: boolean;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  accessDenied?: boolean;
  message?: string;
}

export interface ProfileResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
}

// 프로필 API 함수들
export const profileApi = {
  // 내 프로필 정보 조회
  getMyProfile: async (): Promise<ProfileResponse> => {
    const response = await expressApi.get("/auth/profile");
    return response.data;
  },

  // 특정 사용자 프로필 조회
  getUserProfile: async (userId: string): Promise<ProfileResponse> => {
    const response = await expressApi.get(`/auth/profile/${userId}`);
    return response.data;
  },

  // username으로 사용자 프로필 조회
  getUserProfileByUsername: async (
    username: string
  ): Promise<ProfileResponse> => {
    try {
      const response = await expressApi.get(
        `/auth/profile/username/${username}`
      );
      return response.data;
    } catch (error: any) {
      // 에러 응답에 상태 코드 포함
      if (error.response) {
        throw {
          status: error.response.status,
          message:
            error.response.data?.message || "프로필을 불러오는데 실패했습니다.",
        };
      }
      throw {
        status: 500,
        message: "프로필을 불러오는데 실패했습니다.",
      };
    }
  },

  // 프로필 업데이트
  updateProfile: async (data: {
    nickname?: string;
    bio?: string;
    visibility?: string;
  }): Promise<ProfileResponse> => {
    const response = await expressApi.put("/auth/profile", data);
    return response.data;
  },
};
