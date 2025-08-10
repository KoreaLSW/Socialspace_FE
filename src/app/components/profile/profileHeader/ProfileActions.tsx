"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useFollowActions, useFollowStatus } from "@/hooks/useFollow";

interface ProfileActionsProps {
  profileId: string;
  isMyProfile: boolean;
}

export default function ProfileActions({
  profileId,
  isMyProfile,
}: ProfileActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const { followStatus, mutate: mutateFollowStatus } = useFollowStatus(
    !isMyProfile && profileId ? profileId : null
  );

  const { toggleFollow, toggleFavorite, toggleBlock, isLoading } =
    useFollowActions(profileId || "", () => {
      mutateFollowStatus();
      setShowDropdown(false);
    });

  if (isMyProfile) {
    return (
      <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <span className="text-gray-700 dark:text-gray-300">편집</span>
      </button>
    );
  }

  const handleFollowClick = async () => {
    try {
      await toggleFollow();
    } catch (error) {
      console.error("팔로우 처리 실패:", error);
    }
  };

  const handleFavoriteClick = async () => {
    try {
      await toggleFavorite();
    } catch (error) {
      console.error("친한친구 처리 실패:", error);
    }
  };

  const handleBlockClick = async () => {
    if (confirm("정말로 이 사용자를 차단하시겠습니까?")) {
      try {
        await toggleBlock();
      } catch (error) {
        console.error("차단 처리 실패:", error);
      }
    }
  };

  const handleUnfollowClick = async () => {
    if (confirm("정말로 팔로우를 취소하시겠습니까?")) {
      try {
        await toggleFollow();
      } catch (error) {
        console.error("언팔로우 처리 실패:", error);
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {followStatus?.isFollowing ? (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <span className="text-gray-700 dark:text-gray-300">팔로잉</span>
            <ChevronDown
              size={16}
              className="text-gray-700 dark:text-gray-300"
            />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <button
                onClick={handleFavoriteClick}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {followStatus?.isFavorite
                  ? "친한친구에서 제거"
                  : "친한친구 리스트에 추가"}
              </button>
              <button
                onClick={handleUnfollowClick}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                팔로우 취소
              </button>
            </div>
          )}

          {showDropdown && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
          )}
        </div>
      ) : (
        <button
          onClick={handleFollowClick}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? "처리 중..." : "팔로우"}
        </button>
      )}

      {followStatus?.isBlocked ? (
        <button
          onClick={handleBlockClick}
          disabled={isLoading}
          className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
        >
          {isLoading ? "처리 중..." : "차단중"}
        </button>
      ) : (
        <button
          onClick={handleBlockClick}
          disabled={isLoading}
          className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          {isLoading ? "처리 중..." : "차단"}
        </button>
      )}
    </div>
  );
}
