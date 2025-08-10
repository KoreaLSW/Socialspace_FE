"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useFollowActions, useFollowStatus } from "@/hooks/useFollow";
import UserAvatar from "../common/UserAvatar";
import UserNickName from "../common/UserNickName";

interface User {
  id: string;
  username?: string;
  nickname?: string;
  profile_image?: string;
  avatar?: string;
  followers?: number;
}

export default function UserListItem({
  user,
  avatarSize,
  showNickname,
}: {
  user: User;
  avatarSize: string;
  showNickname: boolean;
}) {
  const { data: session } = useSession();
  const isMe = session?.user?.id === user.id;
  const { followStatus } = useFollowStatus(isMe ? null : user.id);
  const { toggleFollow, isLoading } = useFollowActions(user.id);

  const isFollowing = !!followStatus?.isFollowing;
  const buttonText = isFollowing ? "취소" : "팔로우";

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMe) {
      await toggleFollow();
    }
  };

  return (
    <li className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded shadow">
      <div className="flex items-center space-x-4">
        <div className="shrink-0">
          {(() => {
            const size = avatarSize.includes("w-10")
              ? 40
              : avatarSize.includes("w-8")
              ? 32
              : avatarSize.includes("w-6")
              ? 24
              : 32;
            return (
              <UserAvatar
                src={user.profile_image || user.avatar}
                alt={user.username}
                nameForInitial={user.nickname || user.username}
                size={size}
                className="hover:opacity-80 transition"
                profileUsername={user.username}
              />
            );
          })()}
        </div>
        <div>
          <UserNickName
            username={user.username}
            name={user.username}
            className="font-medium text-gray-900 dark:text-white text-base inline hover:underline"
          />
          {showNickname && user.nickname && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {user.nickname}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.followers} 팔로워
          </p>
        </div>
      </div>
      {!isMe && (
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`text-sm font-medium px-3 py-1 rounded border transition-colors ${
            isFollowing
              ? "text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              : "text-blue-600 border-blue-500 hover:bg-blue-50"
          } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {buttonText}
        </button>
      )}
    </li>
  );
}
