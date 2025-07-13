import axios from "axios";

// Express 서버용 axios 인스턴스
export const expressApi = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL || "http://localhost:4000",
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 - 공통 헤더 설정
expressApi.interceptors.request.use(
  async (config) => {
    config.headers["Content-Type"] = "application/json";
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 공통 에러 처리
expressApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 공통 에러 처리
    console.error("API 요청 오류:", error);
    return Promise.reject(error);
  }
);

// Auth 관련 API 함수들
export const authApi = {
  // 사용자 프로필 업데이트
  updateProfile: async (profileData: {
    userId: string;
    nickname?: string;
    bio?: string;
    profileImage?: string;
  }) => {
    const response = await expressApi.put("/auth/profile", profileData);
    return response.data;
  },

  // 로그아웃 (필요시 서버 측 정리 작업)
  serverLogout: async () => {
    const response = await expressApi.post("/auth/logout");
    return response.data;
  },

  // 기타 필요한 API들...
};
