"use client";

import { useFollowActions, useFollowStatus } from "@/hooks/useFollow";

interface FollowButtonProps {
  targetUserId: string;
  variant?: "default" | "small" | "large";
  onUpdate?: () => void;
  disabled?: boolean;
  className?: string;
  unfollowText?: string; // 언팔로우 시 표시할 텍스트
}

export default function FollowButton({
  targetUserId,
  variant = "default",
  onUpdate,
  disabled = false,
  className = "",
  unfollowText = "팔로잉",
}: FollowButtonProps) {
  const { followStatus } = useFollowStatus(targetUserId);
  const { toggleFollow, isLoading } = useFollowActions(targetUserId, onUpdate);

  const isFollowing = !!followStatus?.isFollowing;
  const isPending = !!followStatus?.isPending;

  const handleClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      await toggleFollow();
    } catch (error) {
      console.error("팔로우 처리 실패:", error);
    }
  };

  // 버튼 텍스트
  const getButtonText = () => {
    if (isLoading) return "처리 중...";
    if (isFollowing) return unfollowText;
    if (isPending) return "요청됨";
    return "팔로우";
  };

  // 버튼 스타일 (variant별)
  const getButtonStyles = () => {
    const baseStyles =
      "font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

    let sizeStyles = "";
    switch (variant) {
      case "small":
        sizeStyles = "text-sm px-3 py-1";
        break;
      case "large":
        sizeStyles = "text-base px-6 py-2";
        break;
      default:
        sizeStyles = "text-sm px-4 py-2";
    }

    let stateStyles = "";
    if (isFollowing) {
      if (variant === "small") {
        stateStyles =
          "text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700";
      } else {
        stateStyles =
          "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";
      }
    } else if (isPending) {
      stateStyles =
        "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/40";
    } else {
      if (variant === "small") {
        stateStyles = "text-blue-600 border border-blue-500 hover:bg-blue-50";
      } else {
        stateStyles = "bg-blue-500 text-white hover:bg-blue-600";
      }
    }

    return `${baseStyles} ${sizeStyles} ${stateStyles} ${className}`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={getButtonStyles()}
    >
      {getButtonText()}
    </button>
  );
}
