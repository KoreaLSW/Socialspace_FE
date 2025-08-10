import { useRef } from "react";
import { likeComment, unlikeComment } from "@/lib/api/comments";
import {
  rollbackCommentsForPost,
  updateCommentsForPost,
} from "@/lib/swr/commentLikeCache";

export function useOptimisticCommentLike(postId: string) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const toggle = (
    commentId: string,
    currentLiked: boolean,
    currentCount: number
  ) => {
    const nextLiked = !currentLiked;
    const nextCount = nextLiked
      ? currentCount + 1
      : Math.max(0, currentCount - 1);

    // 낙관적 업데이트
    updateCommentsForPost(postId, commentId, nextLiked, nextCount);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        if (nextLiked) await likeComment(commentId);
        else await unlikeComment(commentId);
      } catch (e) {
        // 실패 시 롤백
        rollbackCommentsForPost(postId);
      }
    }, 400);
  };

  return { toggle };
}
