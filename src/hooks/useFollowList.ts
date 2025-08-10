import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { followApi } from "@/lib/api/follows";

// 무한 스크롤용: 팔로워 목록
export function useFollowersInfiniteList(
  userId: string | null,
  limit: number = 20
) {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      (pageIndex, previousPageData: any) => {
        if (!userId) return null;
        if (pageIndex === 0) return ["followers", userId, 1, limit];
        const prev = previousPageData?.pagination;
        if (prev && prev.page < prev.totalPages)
          return ["followers", userId, prev.page + 1, limit];
        return null;
      },
      ([, uid, page, lim]) =>
        followApi.getFollowers(uid as string, page as number, lim as number),
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

// 무한 스크롤용: 팔로잉 목록
export function useFollowingInfiniteList(
  userId: string | null,
  limit: number = 20
) {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      (pageIndex, previousPageData: any) => {
        if (!userId) return null;
        if (pageIndex === 0) return ["following", userId, 1, limit];
        const prev = previousPageData?.pagination;
        if (prev && prev.page < prev.totalPages)
          return ["following", userId, prev.page + 1, limit];
        return null;
      },
      ([, uid, page, lim]) =>
        followApi.getFollowing(uid as string, page as number, lim as number),
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
