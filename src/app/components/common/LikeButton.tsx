"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onLike: (isLiked: boolean) => void;
  size?: number;
  disabled?: boolean;
}

export default function LikeButton({
  isLiked,
  likeCount,
  onLike,
  size = 20,
  disabled = false,
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (disabled) return;

    // 애니메이션 트리거
    setIsAnimating(true);

    // 즉시 UI 반응
    onLike(!isLiked);
  };

  // 애니메이션 리셋
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  return (
    <button
      className={`flex items-center space-x-2 transition-all duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
      } ${
        isLiked
          ? "text-red-500 hover:text-red-600"
          : "text-gray-500 hover:text-red-500"
      }`}
      onClick={handleClick}
      disabled={disabled}
    >
      <div
        className={`transition-transform duration-200 ${
          isAnimating ? "scale-125" : "scale-100"
        }`}
      >
        <Heart
          size={size}
          className={`transition-all duration-200 ${
            isLiked ? "fill-current" : "fill-none"
          }`}
        />
      </div>
      <span className="font-medium">{likeCount}</span>
    </button>
  );
}
