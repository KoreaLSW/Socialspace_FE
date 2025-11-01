import { useSession, signIn, signOut } from "next-auth/react";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { authApi, mutationFunctions } from "@/lib/api";
import { useState } from "react";
import type { SignupData, LoginData } from "@/lib/api/auth";

// 통합 사용자 정보 훅 (JWT 토큰 또는 NextAuth 세션)
export function useCurrentUser() {
  const { data: session, status } = useSession();

  // JWT 토큰 확인
  const hasJwtToken =
    typeof window !== "undefined" && !!localStorage.getItem("auth_token");

  // JWT 토큰 또는 NextAuth 세션이 있을 때 백엔드 사용자 정보 조회
  const { data: backendUser, error: backendError } = useSWR(
    hasJwtToken || session ? "/auth/me" : null,
    authApi.getCurrentUser,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분
    }
  );

  const apiUser =
    (backendUser as any)?.data?.user || (backendUser as any)?.data;

  return {
    // 백엔드 사용자 정보 우선, NextAuth 세션 정보로 보완
    user:
      apiUser ||
      (session
        ? {
            id: (session?.user as any)?.id || null,
            email: session?.user?.email || null,
            username: (session?.user as any)?.username || null,
            nickname:
              (session?.user as any)?.nickname || session?.user?.name || null,
            profileImage:
              (session?.user as any)?.profileImage ||
              session?.user?.image ||
              null,
            role: (session?.user as any)?.role || "user",
            emailVerified: (session?.user as any)?.emailVerified || false,
          }
        : null),
    isLoading:
      status === "loading" ||
      (!backendUser && !backendError && (hasJwtToken || !!session)),
    isAuthenticated:
      (status === "authenticated" && !!session) || (hasJwtToken && !!apiUser),
    error: backendError || null,
  };
}

// 로그인 훅
export function useLogin() {
  const login = async (provider: string = "google") => {
    try {
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: "/",
      });
      return { success: !result?.error, data: result };
    } catch (err) {
      console.error("로그인 실패:", err);
      return { success: false, error: err };
    }
  };

  return {
    login,
    isLoggingIn: false, // NextAuth가 처리
    error: null,
  };
}

// 로그아웃 훅
export function useLogout() {
  const logout = async () => {
    try {
      // JWT 토큰 제거
      authApi.removeToken();

      // NextAuth 로그아웃
      await signOut({
        redirect: false,
        callbackUrl: "/auth/login",
      });

      if (typeof window !== "undefined") {
        // SWR 캐시 정리
        window.localStorage.removeItem("swr-cache");
        // 필요시 다른 로컬 스토리지 정리
        window.localStorage.removeItem("user-preferences");

        // 로그인 페이지로 리디렉션
        window.location.href = "/auth/login";
      }

      return { success: true };
    } catch (err) {
      console.error("로그아웃 실패:", err);
      return { success: false, error: err };
    }
  };

  return {
    logout,
    isLoggingOut: false,
    error: null,
  };
}

// 프로필 업데이트 훅
export function useUpdateProfile() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/auth/profile",
    mutationFunctions.updateProfile
  );

  const updateProfile = async (profileData: {
    nickname?: string;
    bio?: string;
    visibility?: "public" | "followers" | "private";
    profileImage?: string;
    isCustomProfileImage?: boolean;
    followApprovalMode?: "auto" | "manual";
    showMutualFollow?: boolean;
  }) => {
    try {
      const result = await trigger(profileData);

      // 프로필 업데이트 후 관련 캐시 무효화
      await mutate("/auth/me");

      return { success: true, data: result };
    } catch (err) {
      console.error("프로필 업데이트 실패:", err);
      return { success: false, error: err };
    }
  };

  return {
    updateProfile,
    isUpdating: isMutating,
    error,
  };
}

// ===== 일반 회원가입/로그인 훅 =====

// 일반 회원가입 훅 (이메일 + 비밀번호)
export function useLocalSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = async (data: SignupData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.signup(data);

      // 회원가입 후 관련 캐시 무효화
      await mutate("/auth/me");

      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      setError(errorMessage);
      console.error("회원가입 실패:", err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signup,
    isLoading,
    error,
  };
}

// 일반 로그인 훅 (이메일 + 비밀번호)
export function useLocalLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.login(data);

      // 로그인 후 관련 캐시 무효화
      await mutate("/auth/me");

      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "로그인 중 오류가 발생했습니다.";
      setError(errorMessage);
      console.error("로그인 실패:", err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
    error,
  };
}

// JWT 토큰 확인 훅
export function useAuthToken() {
  const getToken = () => authApi.getToken();
  const removeToken = () => authApi.removeToken();

  return {
    getToken,
    removeToken,
  };
}
