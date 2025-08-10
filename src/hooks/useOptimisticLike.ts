import { useRef } from "react";
import { mutate } from "swr";
import { SWRInfiniteKeyedMutator } from "swr/infinite";
import { InfinitePostsResponse, UserPostsResponse } from "@/hooks/usePosts";
import { updateInfinitePosts, updateUserPosts } from "@/lib/swr/postLikeCache";

interface UseOptimisticLikeParams {
  like: (postId: string) => Promise<void>;
  unlike: (postId: string) => Promise<void>;
  mutatePosts?: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
  mutateUserPosts?: SWRInfiniteKeyedMutator<any>;
}

export function useOptimisticLike({
  like,
  unlike,
  mutatePosts,
  mutateUserPosts,
}: UseOptimisticLikeParams) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const applyCaches = (
    postId: string,
    liked: boolean,
    count: number,
    revalidate = false
  ) => {
    // 전역 캐시 업데이트
    mutate((key: any) => {
      if (Array.isArray(key) && key[0] === "/posts") {
        return updateInfinitePosts(postId, liked, count);
      }
      if (Array.isArray(key) && key[0] === "/user-posts") {
        return updateUserPosts(postId, liked, count);
      }
      return undefined;
    }, revalidate);

    // 개별 mutate도 지원
    if (mutatePosts) {
      mutatePosts(updateInfinitePosts(postId, liked, count), revalidate);
    }
    if (mutateUserPosts) {
      mutateUserPosts(updateUserPosts(postId, liked, count), revalidate);
    }
  };

  const toggle = (
    postId: string,
    currentLiked: boolean,
    currentCount: number,
    onSuccess?: (liked: boolean, count: number) => void
  ) => {
    const nextLiked = !currentLiked;
    const nextCount = nextLiked ? currentCount + 1 : currentCount - 1;

    // 즉시 낙관적 업데이트
    applyCaches(postId, nextLiked, nextCount, false);

    // 기존 타이머 클리어 후 디바운스로 서버 요청
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        if (nextLiked) await like(postId);
        else await unlike(postId);
        onSuccess?.(nextLiked, nextCount);
      } catch (e) {
        // 실패 시 롤백
        const rollbackLiked = !nextLiked;
        const rollbackCount = nextLiked ? nextCount - 1 : nextCount + 1;
        applyCaches(postId, rollbackLiked, rollbackCount, false);
      }
    }, 500);
  };

  return { toggle };
}
