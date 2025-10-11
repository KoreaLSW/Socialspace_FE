import useSWR from "swr";
import { followApi } from "@/lib/api/follows";

// 상호 팔로우 수 조회 훅
export function useMutualFollowCount(userId: string | null) {
  const { data, error, isLoading } = useSWR(
    userId ? `/mutual-follows-count/${userId}` : null,
    () => followApi.getMutualFollows(userId!, 1, 1), // 최소한의 데이터만 요청
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    count: data?.pagination?.total || 0,
    isLoading,
    error,
  };
}
















