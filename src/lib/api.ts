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

// 게시글 API 함수들
export const postsApi = {
  // 게시글 생성
  create: async (data: any) => {
    const response = await expressApi.post("/posts", data);
    return response.data;
  },

  // 게시글 목록 조회
  getAll: async () => {
    const response = await expressApi.get("/posts");
    return response.data;
  },

  // 특정 게시글 조회
  getById: async (id: string) => {
    const response = await expressApi.get(`/posts/${id}`);
    return response.data;
  },

  // 사용자별 게시글 조회
  getByUserId: async (userId: string) => {
    const response = await expressApi.get(`/posts/user/${userId}`);
    return response.data;
  },

  // 해시태그별 게시글 조회
  getByHashtag: async (hashtag: string) => {
    const response = await expressApi.get(`/posts/hashtag/${hashtag}`);
    return response.data;
  },

  // 게시글 업데이트
  update: async (id: string, data: any) => {
    const response = await expressApi.put(`/posts/${id}`, data);
    return response.data;
  },

  // 게시글 삭제
  delete: async (id: string) => {
    const response = await expressApi.delete(`/posts/${id}`);
    return response.data;
  },

  // 게시글 좋아요
  like: async (id: string) => {
    const response = await expressApi.post(`/posts/${id}/like`);
    return response.data;
  },

  // 게시글 좋아요 취소
  unlike: async (id: string) => {
    const response = await expressApi.delete(`/posts/${id}/like`);
    return response.data;
  },

  // 단일 이미지 업로드
  uploadImage: async (formData: FormData) => {
    const response = await expressApi.post("/posts/upload/single", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // 다중 이미지 업로드
  uploadImages: async (formData: FormData) => {
    const response = await expressApi.post("/posts/upload/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

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

// SWR mutation 함수들
export const mutationFunctions = {
  // 게시글 생성
  createPost: async (url: string, { arg }: { arg: any }) => {
    return await postsApi.create(arg);
  },

  // 게시글 업데이트
  updatePost: async (
    url: string,
    { arg }: { arg: { id: string; data: any } }
  ) => {
    return await postsApi.update(arg.id, arg.data);
  },

  // 게시글 삭제
  deletePost: async (url: string, { arg }: { arg: { id: string } }) => {
    return await postsApi.delete(arg.id);
  },

  // 게시글 좋아요
  likePost: async (url: string, { arg }: { arg: { id: string } }) => {
    return await postsApi.like(arg.id);
  },

  // 게시글 좋아요 취소
  unlikePost: async (url: string, { arg }: { arg: { id: string } }) => {
    return await postsApi.unlike(arg.id);
  },

  // 프로필 업데이트
  updateProfile: async (url: string, { arg }: { arg: any }) => {
    return await authApi.updateProfile(arg);
  },

  // 로그아웃
  logout: async (url: string) => {
    return await authApi.logout();
  },
};
