"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useFollowStatus } from "@/hooks/useFollow";
import { useFavoriteActions } from "@/hooks/useFavorites";
import FollowButton from "../../common/FollowButton";

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

  const { toggleFavorite, isLoading: favoriteLoading } = useFavoriteActions();

  if (isMyProfile) {
    return (
      <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <span className="text-gray-700 dark:text-gray-300">편집</span>
      </button>
    );
  }

  const handleFavoriteClick = async () => {
    try {
      await toggleFavorite(profileId);
      mutateFollowStatus(); // 팔로우 상태 업데이트
    } catch (error) {
      console.error("친한친구 처리 실패:", error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {followStatus?.isFollowing ? (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={favoriteLoading}
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
                disabled={favoriteLoading}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {followStatus?.isFavorite
                  ? "친한친구에서 제거"
                  : "친한친구 리스트에 추가"}
              </button>
              <FollowButton
                targetUserId={profileId}
                variant="small"
                onUpdate={() => {
                  mutateFollowStatus();
                  setShowDropdown(false);
                }}
                unfollowText="팔로우 취소"
                className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-0 rounded-none"
              />
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
        <FollowButton
          targetUserId={profileId}
          onUpdate={() => mutateFollowStatus()}
        />
      )}

      <button
        onClick={() => {}} // 차단 기능은 별도 컴포넌트로 분리할 수 있음
        className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        차단
      </button>
    </div>
  );
}
