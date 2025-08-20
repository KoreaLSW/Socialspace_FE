import useSWRInfinite from "swr/infinite";
import { followApi } from "@/lib/api/follows";
import { useCallback } from "react";

interface UseLikeListParams {
  isOpen: boolean;
  postId?: string;
  commentId?: string;
  limit?: number;
}

export function useLikeList({
  isOpen,
  postId,
  commentId,
  limit = 10,
}: UseLikeListParams) {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      (pageIndex, previousPageData: any) => {
        // 모달이 닫혀있으면 요청 자체를 막아 과도한 재요청 방지
        if (!isOpen) return null;

        const targetId = commentId || postId;
        const targetKey = commentId ? "comment-likes" : "post-likes";

        if (!targetId) return null;

        if (pageIndex === 0) return [targetKey, targetId, 1, limit];

        const prev = previousPageData?.pagination;
        if (prev && prev.page < prev.totalPages) {
          return [targetKey, targetId, prev.page + 1, limit];
        }

        return null;
      },
      ([key, id, page, limit]) =>
        (key as string) === "comment-likes"
          ? followApi.getCommentLikes(
              id as string,
              page as number,
              limit as number
            )
          : followApi.getPostLikes(
              id as string,
              page as number,
              limit as number
            ),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        keepPreviousData: true,
        dedupingInterval: 2000,
      }
    );

  const pages = data || [];
  const users = pages.flatMap((p: any) => p?.data || []);
  const totalPages = pages[0]?.pagination?.totalPages || 0;
  const hasMore = size < totalPages;

  // 캐시 무효화 함수 추가
  const invalidateCache = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
    pages,
    users,
    totalPages,
    hasMore,
    invalidateCache,
  };
}
