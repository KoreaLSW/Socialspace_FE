import axios from "axios";
import { getSession } from "next-auth/react";

// Express 서버용 axios 인스턴스
export const expressApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// NextAuth 세션 정보를 헤더에 추가하는 함수
const addSessionToHeaders = async (config: any) => {
  try {
    if (typeof window === "undefined") {
      return config; // 서버 사이드에서는 세션 정보 추가 불가
    }

    // NextAuth 세션 가져오기
    const session = await getSession();

    console.log("🔍 NextAuth 세션 확인:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: (session?.user as any)?.id,
      email: session?.user?.email,
    });

    if (!session?.user) {
      console.warn("⚠️ NextAuth 세션이 없습니다.");
      return config;
    }

    // 세션 정보를 헤더에 추가
    const sessionData = {
      userId: (session.user as any).id,
      email: session.user.email,
      username: (session.user as any).username,
      nickname: (session.user as any).nickname,
    };

    config.headers["x-session-data"] = JSON.stringify(sessionData);

    console.log("✅ NextAuth 세션 정보가 헤더에 추가됨:", {
      userId: sessionData.userId,
      email: sessionData.email,
    });

    return config;
  } catch (error) {
    console.error("NextAuth 세션 추가 실패:", error);
    return config;
  }
};

// 요청 인터셉터 - NextAuth 세션 정보 자동 추가
expressApi.interceptors.request.use(
  async (config) => {
    // 기본 Content-Type 설정 (multipart/form-data가 아닌 경우)
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    // 세션 정보를 헤더에 추가
    return await addSessionToHeaders(config);
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
    // 디버깅을 위한 상세 에러 로그
    console.error("🔴 API 요청 오류:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
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
