"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useOptimisticCommentLike } from "@/hooks/useOptimisticCommentLike";
import LikeListModal from "@/app/components/modal/like/LikeListModal";

interface CommentLikeButtonProps {
  postId: string;
  commentId: string;
  isLiked: boolean;
  count: number;
  size?: number; // default 14
  className?: string;
}

export default function CommentLikeButton({
  postId,
  commentId,
  isLiked,
  count,
  size = 14,
  className = "",
}: CommentLikeButtonProps) {
  const { toggle } = useOptimisticCommentLike(postId);
  const [isOpen, setIsOpen] = useState(false);
  const [liked, setLiked] = useState<boolean>(isLiked);
  const [likeCount, setLikeCount] = useState<number>(count || 0);

  // 외부 데이터 변경 시 동기화
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);
  useEffect(() => {
    setLikeCount(count || 0);
  }, [count]);

  const handleToggle: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    // 즉시 로컬 반영
    setLiked(nextLiked);
    setLikeCount(nextCount);
    // 캐시 낙관 업데이트 + 서버 호출
    toggle(commentId, liked, likeCount);
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={`flex items-center space-x-1 transition-colors ${
          liked
            ? "text-red-500 hover:text-red-600"
            : "text-gray-500 hover:text-red-500"
        } ${className}`}
        title={liked ? "좋아요 취소" : "좋아요"}
      >
        <Heart size={size} className={liked ? "fill-current" : ""} />
        <span
          className="text-xs"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          role="button"
          aria-label="좋아요한 사용자 보기"
          title="좋아요한 사용자 보기"
        >
          {likeCount}
        </span>
      </button>
      <LikeListModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        commentId={commentId}
      />
    </>
  );
}
