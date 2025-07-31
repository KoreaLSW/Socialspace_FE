"use client";

import { Heart } from "lucide-react";
import { useState, useRef } from "react";
import { usePostActions } from "@/hooks/usePostActions";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (postId: string, isLiked: boolean, newCount: number) => void;
  size?: number;
  className?: string;
}

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  onLikeChange,
  size = 20,
  className = "",
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null); // 디바운스 타이머
  const lastIntendedState = useRef({ isLiked: initialLiked, likeCount: initialCount }); // 마지막 상태 저장
  const { likePost, unlikePost } = usePostActions();

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 현재 상태 저장
    const newLiked = !isLiked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;

    // UI는 즉시 반응
    setIsLiked(newLiked);
    setLikeCount(newCount);

    // 서버 전송용으로 상태 기억
    lastIntendedState.current = {
      isLiked: newLiked,
      likeCount: newCount,
    };

    // 이전 타이머 제거
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 새 타이머 설정 (0.5초 후 서버 요청)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        if (newLiked) {
          await likePost(postId);
        } else {
          await unlikePost(postId);
        }

        onLikeChange?.(postId, newLiked, newCount);
      } catch (error) {
        console.error("좋아요 처리 실패:", error);
        // 실패 시 롤백
        setIsLiked(!newLiked);
        setLikeCount(newLiked ? newCount - 1 : newCount + 1);
      }
    }, 500);
  };

  return (
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
      <span className={`font-medium ${isLiked ? "text-red-500" : ""}`}>
        {likeCount}
      </span>
    </button>
  );
}
