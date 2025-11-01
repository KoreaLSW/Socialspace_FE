import { expressApi } from "./config";

// 일반 회원가입 요청 데이터 타입
export interface SignupData {
  email: string;
  password: string;
  username: string;
  nickname?: string;
}

// 일반 로그인 요청 데이터 타입
export interface LoginData {
  email: string;
  password: string;
}

// 인증 API 함수들
export const authApi = {
  // ===== 일반 회원가입/로그인 =====

  // 중복 체크 (이메일, 사용자명, 닉네임)
  checkDuplicate: async (
    type: "email" | "username" | "nickname",
    value: string
  ) => {
    const response = await expressApi.get("/auth/check-duplicate", {
      params: { type, value },
    });
    return response.data;
  },

  // 일반 회원가입 (이메일 + 비밀번호)
  signup: async (data: SignupData) => {
    const response = await expressApi.post("/auth/signup", data);

    // JWT 토큰 저장
    if (response.data.data?.token) {
      localStorage.setItem("auth_token", response.data.data.token);
    }

    return response.data;
  },

  // 일반 로그인 (이메일 + 비밀번호)
  login: async (data: LoginData) => {
    const response = await expressApi.post("/auth/login", data);

    // JWT 토큰 저장
    if (response.data.data?.token) {
      localStorage.setItem("auth_token", response.data.data.token);
    }

    return response.data;
  },

  // JWT 토큰 가져오기
  getToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  },

  // JWT 토큰 제거
  removeToken: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_token");
  },

  // ===== 기존 NextAuth/Google OAuth =====

  // 현재 사용자 정보 조회 (JWT 또는 NextAuth)
  getCurrentUser: async () => {
    try {
      const response = await expressApi.get("/auth/me");
      return response.data;
    } catch (error: any) {
      // 토큰이 만료되었거나 유효하지 않으면 로그아웃 처리
      if (error.response?.status === 401) {
        authApi.removeToken();
      }
      throw error;
    }
  },

  // 사용자 프로필 업데이트
  updateProfile: async (data: any) => {
    const response = await expressApi.put("/auth/profile", data);
    return response.data;
  },

  // 로그아웃 처리
  logout: async () => {
    // JWT 토큰 제거
    authApi.removeToken();

    const response = await expressApi.post("/auth/logout");
    return response.data;
  },
};
