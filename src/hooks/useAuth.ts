import { useSession, signIn, signOut } from "next-auth/react";
import useSWRMutation from "swr/mutation";
import { authApi } from "@/lib/api";

// NextAuth 세션 기반 사용자 정보 훅
export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    error: null,
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
  const { trigger, isMutating, error } = useSWRMutation(
    "/auth/logout",
    authApi.serverLogout
  );

  const logout = async () => {
    try {
      // 필요시 서버 측 정리 작업
      await trigger();

      // NextAuth 세션 정리
      await signOut({
        redirect: false,
        callbackUrl: "/auth/login",
      });

      return { success: true };
    } catch (err) {
      console.error("로그아웃 실패:", err);
      return { success: false, error: err };
    }
  };

  return {
    logout,
    isLoggingOut: isMutating,
    error,
  };
}

// 프로필 업데이트 훅
export function useUpdateProfile() {
  const { data: session } = useSession();
  const { trigger, isMutating, error } = useSWRMutation(
    "/auth/profile",
    (url: string, { arg }: { arg: any }) => authApi.updateProfile(arg)
  );

  const updateProfile = async (profileData: {
    nickname?: string;
    bio?: string;
    profileImage?: string;
  }) => {
    try {
      if (!session?.user?.id) {
        throw new Error("사용자 세션이 없습니다");
      }

      const result = await trigger({
        userId: session.user.id,
        ...profileData,
      });
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
