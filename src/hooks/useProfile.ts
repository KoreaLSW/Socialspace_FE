import useSWR from "swr";
import { profileApi, UserProfile } from "@/lib/api/profile";

// 내 프로필 조회 훅
export function useMyProfile() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: UserProfile;
  }>("/profile/me", () => profileApi.getMyProfile(), {
    revalidateOnFocus: false,
  });

  return {
    profile: data?.data,
    isLoading,
    error,
    mutate,
  };
}

// username으로 사용자 프로필 조회 훅
export function useUserProfile(username: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    username ? `/profile/username/${username}` : null,
    username ? () => profileApi.getUserProfileByUsername(username) : null,
    {
      revalidateOnFocus: false,
      onError: (err) => {
        console.error("프로필 조회 에러:", err);
      },
    }
  );

  return {
    profile: data?.data,
    isLoading,
    error,
    mutate,
  };
}
