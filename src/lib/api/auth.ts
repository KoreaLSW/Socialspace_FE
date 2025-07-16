import { expressApi } from "./config";

// 인증 API 함수들
export const authApi = {
  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    const response = await expressApi.get("/auth/me");
    return response.data;
  },

  // 사용자 프로필 업데이트
  updateProfile: async (data: any) => {
    const response = await expressApi.put("/auth/profile", data);
    return response.data;
  },

  // 로그아웃 처리
  logout: async () => {
    const response = await expressApi.post("/auth/logout");
    return response.data;
  },
};
