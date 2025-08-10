"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import LikeListModal from "@/app/components/modal/like/LikeListModal";
import { usePostActions } from "@/hooks/usePostActions";
import { SWRInfiniteKeyedMutator } from "swr/infinite";
import {
  InfinitePostsResponse,
  UserPostsResponse,
  InfinitePostsMutateFunction,
} from "@/hooks/usePosts";
import { useOptimisticLike } from "@/hooks/useOptimisticLike";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (postId: string, isLiked: boolean, newCount: number) => void;
  size?: number;
  className?: string;
  mutatePosts?: InfinitePostsMutateFunction;
  mutateUserPosts?: SWRInfiniteKeyedMutator<any>;
}

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  onLikeChange,
  size = 20,
  className = "",
  mutatePosts,
  mutateUserPosts,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLikeListOpen, setIsLikeListOpen] = useState(false);
  const { likePost, unlikePost } = usePostActions();
  const { toggle } = useOptimisticLike({
    like: likePost,
    unlike: unlikePost,
    mutatePosts,
    mutateUserPosts,
  });

  // props가 변경될 때 상태 업데이트
  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newLiked = !isLiked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    setIsLiked(newLiked);
    setLikeCount(newCount);

    toggle(postId, !newLiked, likeCount, (liked, count) => {
      onLikeChange?.(postId, liked, count);
    });
  };

  return (
    <>
      <button
        className={`flex items-center space-x-2 transition-all duration-200 group ${
          isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
        } ${className}`}
        onClick={handleLikeToggle}
        title={isLiked ? "좋아요 취소" : "좋아요"}
      >
        <Heart
          size={size}
          fill={isLiked ? "currentColor" : "none"}
          className={`transition-all duration-200 ${
            isLiked ? "scale-110 drop-shadow-sm" : "group-hover:scale-105"
          }`}
        />
        <span
          className={`font-medium ${
            isLiked ? "text-red-500" : ""
          } cursor-pointer hover:underline`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsLikeListOpen(true);
          }}
          title="좋아요한 사용자 보기"
          role="button"
          aria-label="좋아요한 사용자 보기"
        >
          {likeCount}
        </span>
      </button>
      <LikeListModal
        isOpen={isLikeListOpen}
        onClose={() => setIsLikeListOpen(false)}
        postId={postId}
      />
    </>
  );
}
