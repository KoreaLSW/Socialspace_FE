import useSWR from "swr";
import { fetcher } from "@/lib/api/config";
import { UserProfile, ProfileResponse } from "@/lib/api/profile";

// 내 프로필 정보를 가져오는 훅
export const useMyProfile = () => {
  const { data, error, isLoading, mutate } = useSWR<ProfileResponse>(
    "/auth/profile",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분
    }
  );

  return {
    profile: data?.data,
    isLoading,
    error,
    mutate,
  };
};

// 특정 사용자의 프로필 정보를 가져오는 훅
export const useUserProfile = (userId: string) => {
  const { data, error, isLoading, mutate } = useSWR<ProfileResponse>(
    userId ? `/auth/profile/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분
    }
  );

  return {
    profile: data?.data,
    isLoading,
    error,
    mutate,
  };
};
