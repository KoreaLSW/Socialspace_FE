import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api/config";
import { postsApi } from "@/lib/api/posts";
import { ApiPost } from "@/types/post";

interface UseUserPostsOptions {
  userId: string;
  type?: "posts" | "media" | "likes";
  limit?: number;
}

export function useUserPosts({
  userId,
  type = "posts",
  limit = 12,
}: UseUserPostsOptions) {
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<ApiPost[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 통합된 캐시 키 사용 (모든 페이지를 하나로 관리)
  const cacheKey = type === "posts" ? [`user-posts-all-${type}`, userId] : null;

  const { data, error, isLoading, mutate } = useSWR(cacheKey, async () => {
    if (type === "posts") {
      // 모든 페이지 데이터를 한 번에 가져오거나, 현재 페이지만 가져오기
      return postsApi.getUserPostsPaginated(userId, page, limit);
    }
    return null;
  });

  // 초기 로딩 시 게시물 설정
  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllPosts(data.data);
      } else {
        // 중복 제거 로직 추가
        setAllPosts((prev) => {
          const existingIds = new Set(prev.map((post) => post.id));
          const newPosts = data.data.filter(
            (post: ApiPost) => !existingIds.has(post.id)
          );
          return [...prev, ...newPosts];
        });
      }

      // 더 불러올 게시물이 있는지 확인
      const totalPages = data.pagination?.totalPages || 1;
      setHasMore(page < totalPages);
    }
  }, [data, page]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (data && !isLoading && isLoadingMore) {
      const timer = setTimeout(() => {
        setIsLoadingMore(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [data, isLoading, isLoadingMore]);

  // 탭 변경 시 상태 초기화
  const resetState = () => {
    setPage(1);
    setAllPosts([]);
    setHasMore(true);
    setIsLoadingMore(false);
  };

  return {
    posts: allPosts,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    isInitialLoading: isLoading && allPosts.length === 0,
    loadMore: handleLoadMore,
    resetState,
    mutate, // SWR의 mutate 함수 노출
  };
}
