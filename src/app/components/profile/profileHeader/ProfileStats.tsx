import React, { memo } from "react";

function ProfileStats({
  postsCount,
  followersCount,
  followingCount,
  className,
  onFollowersClick,
  onFollowingClick,
}: {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  className?: string;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
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
          onClick={onFollowersClick}
          className="font-bold text-gray-900 dark:text-white hover:underline"
        >
          {followersCount.toLocaleString()}
        </button>
        <button
          type="button"
          onClick={onFollowersClick}
          className="text-gray-500 dark:text-gray-400 ml-1 hover:underline"
        >
          팔로워
        </button>
      </div>
      <div>
        <button
          type="button"
          onClick={onFollowingClick}
          className="font-bold text-gray-900 dark:text-white hover:underline"
        >
          {followingCount.toLocaleString()}
        </button>
        <button
          type="button"
          onClick={onFollowingClick}
          className="text-gray-500 dark:text-gray-400 ml-1 hover:underline"
        >
          팔로잉
        </button>
      </div>
    </div>
  );
}

export default memo(ProfileStats);
