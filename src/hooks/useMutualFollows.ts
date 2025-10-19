import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { followApi } from "@/lib/api/follows";

// 무한 스크롤용: 상호 팔로우 목록
export function useMutualFollowsInfiniteList(
  userId: string | null,
  limit: number = 20
) {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      (pageIndex, previousPageData: any) => {
        if (!userId) return null;
        if (pageIndex === 0) return ["mutual-follows", userId, 1, limit];
        const prev = previousPageData?.pagination;
        if (prev && prev.page < prev.totalPages)
          return ["mutual-follows", userId, prev.page + 1, limit];
        return null;
      },
      ([, uid, page, lim]) =>
        followApi.getMutualFollows(
          uid as string,
          page as number,
          lim as number
        ),
      { revalidateOnFocus: false, keepPreviousData: true }
    );

  const pages = data || [];
  const users = pages.flatMap((p: any) => p?.data || []);
  const total = pages[0]?.pagination?.total || 0;
  const totalPages = pages[0]?.pagination?.totalPages || 0;
  const hasMore = size < totalPages;

  return {
    users,
    total,
    totalPages,
    size,
    setSize,
    hasMore,
    isLoading: isLoading && size === 0,
    isLoadingMore: isValidating && size > 0,
    error,
    mutate,
  };
}

// 단일 페이지용: 상호 팔로우 목록
export function useMutualFollows(
  userId: string | null,
  page: number = 1,
  limit: number = 20
) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/mutual-follows/${userId}?page=${page}&limit=${limit}` : null,
    () => followApi.getMutualFollows(userId!, page, limit),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    users: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}





















