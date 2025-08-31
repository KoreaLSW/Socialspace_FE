import { useSession, signIn, signOut } from "next-auth/react";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { authApi, mutationFunctions } from "@/lib/api";

// NextAuth 세션 기반 사용자 정보 훅
export function useCurrentUser() {
  const { data: session, status } = useSession();

  // NextAuth 세션이 있을 때만 백엔드 사용자 정보 조회
  const { data: backendUser, error: backendError } = useSWR(
    session ? "/auth/me" : null,
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
    user: apiUser || {
      id: (session?.user as any)?.id || null,
      email: session?.user?.email || null,
      username: (session?.user as any)?.username || null,
      nickname: (session?.user as any)?.nickname || session?.user?.name || null,
      profileImage:
        (session?.user as any)?.profileImage || session?.user?.image || null,
      role: (session?.user as any)?.role || "user",
      emailVerified: (session?.user as any)?.emailVerified || false,
    },
    isLoading:
      status === "loading" || (!backendUser && !backendError && !!session),
    isAuthenticated: status === "authenticated" && !!session,
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
      await signOut({
        redirect: false,
        callbackUrl: "/auth/login",
      });
      if (typeof window !== "undefined") {
        // SWR 캐시 정리
        window.localStorage.removeItem("swr-cache");
        // 필요시 다른 로컬 스토리지 정리
        window.localStorage.removeItem("user-preferences");
      }

      return { success: true };
    } catch (err) {
      console.error("로그아웃 실패:", err);
      return { success: false, error: err };
    }
  };

  return {
    logout,
    isLoggingOut: false, // NextAuth가 처리하므로 간단히 false
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
