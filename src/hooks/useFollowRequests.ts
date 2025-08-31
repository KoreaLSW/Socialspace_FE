import useSWR from "swr";
import { followApi } from "@/lib/api/follows";

// 팔로우 요청 목록 조회
export function useFollowRequests(page: number = 1, limit: number = 20) {
  const { data, error, isLoading, mutate } = useSWR(
    `/follow-requests?page=${page}&limit=${limit}`,
    () => followApi.getFollowRequests(page, limit),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    requests: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

// 팔로우 요청 수만 조회 (첫 페이지만 요청해서 total 가져오기)
export function useFollowRequestsCount() {
  const { data, error, isLoading } = useSWR(
    "/follow-requests-count",
    () => followApi.getFollowRequests(1, 1), // 최소한의 데이터만 요청
    {
      revalidateOnFocus: true, // 설정 페이지 방문 시마다 갱신
      revalidateOnReconnect: true,
    }
  );

  // 디버깅 로그 추가
  console.log("🔢 팔로우 요청 수 데이터:", {
    data,
    count: data?.pagination?.total,
    isLoading,
    error,
  });

  return {
    count: data?.pagination?.total || 0,
    isLoading,
    error,
  };
}
