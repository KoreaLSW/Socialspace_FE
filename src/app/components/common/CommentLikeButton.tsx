"use client";

import { useState } from "react";
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

  const handleToggle: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(commentId, isLiked, count);
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={`flex items-center space-x-1 transition-colors ${
          isLiked
            ? "text-red-500 hover:text-red-600"
            : "text-gray-500 hover:text-red-500"
        } ${className}`}
        title={isLiked ? "좋아요 취소" : "좋아요"}
      >
        <Heart size={size} className={isLiked ? "fill-current" : ""} />
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
          {count || 0}
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
