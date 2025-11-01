import axios from "axios";
import { getSession } from "next-auth/react";

// Express 서버용 axios 인스턴스
export const expressApi = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL || "http://localhost:4000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 인증 정보를 헤더에 추가하는 함수
const addAuthToHeaders = async (config: any) => {
  try {
    if (typeof window === "undefined") {
      return config; // 서버 사이드에서는 세션 정보 추가 불가
    }

    // 1. JWT 토큰 확인 (로컬 회원가입/로그인)
    const jwtToken = localStorage.getItem("auth_token");
    if (jwtToken) {
      config.headers["Authorization"] = `Bearer ${jwtToken}`;
      return config;
    }

    // 2. NextAuth 세션 확인 (Google OAuth)
    // JWT 토큰이 없을 때만 세션 확인 (중복 요청 방지)
    const session = await getSession();
    // 디버깅 로그는 필요시에만 활성화
    // console.log("🔵 getSession() 결과:", {
    //   hasSession: !!session,
    //   hasUser: !!session?.user,
    //   userId: (session?.user as any)?.id,
    //   email: session?.user?.email,
    //   username: (session?.user as any)?.username,
    // });

    if (!session?.user) {
      // 인증 정보가 없어도 요청은 계속 진행 (회원가입 등 공개 API용)
      return config;
    }

    // 세션 정보를 헤더에 추가 (Base64 인코딩으로 한글 문제 해결)
    const sessionData = {
      userId: (session.user as any).id,
      email: session.user.email,
      username: (session.user as any).username,
      nickname: (session.user as any).nickname,
    };

    // 디버깅 로그는 필요시에만 활성화
    // console.log("🔵 헤더에 추가할 세션 데이터:", sessionData);

    // Base64 인코딩으로 한글 문제 해결
    const encodedSessionData = btoa(
      encodeURIComponent(JSON.stringify(sessionData))
    );
    config.headers["x-session-data"] = encodedSessionData;

    // console.log("✅ x-session-data 헤더 추가 완료");

    return config;
  } catch (error) {
    // 인증 정보 추가 실패해도 요청은 계속 진행
    console.warn("⚠️ 인증 정보 추가 중 에러 (요청은 계속 진행):", error);
    return config;
  }
};

// 요청 인터셉터 - 인증 정보 자동 추가
expressApi.interceptors.request.use(
  async (config) => {
    // 기본 Content-Type 설정 (multipart/form-data가 아닌 경우)
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    // 인증 정보를 헤더에 추가 (JWT 또는 NextAuth 세션)
    return await addAuthToHeaders(config);
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
    // 404 에러는 차단된 게시물이거나 존재하지 않는 리소스로 정상적인 처리
    if (error.response?.status === 404) {
      return Promise.reject(error);
    }

    // 디버깅을 위한 상세 에러 로그 (404 제외)
    console.error("🔴 API 요청 오류:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });

    // 401 오류 시 NextAuth 세션 만료 처리
    if (error.response?.status === 401) {
      console.warn("인증이 필요합니다. 로그인 페이지로 이동합니다.");
      // NextAuth 로그인 페이지로 리디렉션
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

// SWR용 fetcher 함수
export const fetcher = async (url: string) => {
  const response = await expressApi.get(url);
  return response.data;
};
