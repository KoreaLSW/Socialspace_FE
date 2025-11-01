import React, { memo } from "react";

function ProfileStats({
  postsCount,
  followersCount,
  followingCount,
  mutualFollowCount,
  className,
  onFollowersClick,
  onFollowingClick,
  onMutualFollowClick,
  isPrivateProfile = false,
  showMutualFollow = true,
}: {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  mutualFollowCount?: number;
  className?: string;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onMutualFollowClick?: () => void;
  isPrivateProfile?: boolean;
  showMutualFollow?: boolean;
}) {
  return (
    <div
      className={`flex items-center space-x-6${
        className ? ` ${className}` : ""
      }`}
    >
      <div>
        <span className="font-bold text-gray-900 dark:text-white">
          {postsCount.toLocaleString()}
        </span>
        <span className="text-gray-500 dark:text-gray-400 ml-1">게시물</span>
      </div>
      <div>
        <button
          type="button"
          onClick={isPrivateProfile ? undefined : onFollowersClick}
          className={`font-bold ${
            isPrivateProfile
              ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "text-gray-900 dark:text-white hover:underline cursor-pointer"
          }`}
          disabled={isPrivateProfile}
        >
          {followersCount.toLocaleString()}
        </button>
        <button
          type="button"
          onClick={isPrivateProfile ? undefined : onFollowersClick}
          className={`${
            isPrivateProfile
              ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
          } ml-1`}
          disabled={isPrivateProfile}
        >
          팔로워
        </button>
      </div>
      <div>
        <button
          type="button"
          onClick={isPrivateProfile ? undefined : onFollowingClick}
          className={`font-bold ${
            isPrivateProfile
              ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "text-gray-900 dark:text-white hover:underline cursor-pointer"
          }`}
          disabled={isPrivateProfile}
        >
          {followingCount.toLocaleString()}
        </button>
        <button
          type="button"
          onClick={isPrivateProfile ? undefined : onFollowingClick}
          className={`${
            isPrivateProfile
              ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
          } ml-1`}
          disabled={isPrivateProfile}
        >
          팔로잉
        </button>
      </div>

      {/* 맞팔로우 표시 (설정에 따라 조건부 렌더링) */}
      {showMutualFollow && mutualFollowCount !== undefined && (
        <div>
          <button
            type="button"
            onClick={isPrivateProfile ? undefined : onMutualFollowClick}
            className={`font-bold ${
              isPrivateProfile
                ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "text-gray-900 dark:text-white hover:underline cursor-pointer"
            }`}
            disabled={isPrivateProfile}
          >
            {mutualFollowCount.toLocaleString()}
          </button>
          <button
            type="button"
            onClick={isPrivateProfile ? undefined : onMutualFollowClick}
            className={`${
              isPrivateProfile
                ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
            } ml-1`}
            disabled={isPrivateProfile}
          >
            맞팔로우
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ProfileStats);
