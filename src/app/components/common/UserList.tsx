"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useFollowActions, useFollowStatus } from "@/hooks/useFollow";

interface User {
  id: string;
  username?: string;
  nickname?: string;
  profile_image?: string;
  avatar?: string;
  followers?: number;
}

interface UserListProps {
  users: User[];
  avatarSize?: string; // tailwind width/height ex: 'w-8 h-8'
  showNickname?: boolean;
}

export default function UserList({
  users,
  avatarSize = "w-10 h-10",
  showNickname = false,
}: UserListProps) {
  return (
    <ul className="space-y-4">
      {users.map((user) => (
        <UserListItem
          key={user.id}
          user={user}
          avatarSize={avatarSize}
          showNickname={showNickname}
        />
      ))}
    </ul>
  );
}

function UserListItem({
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
        <Link href={`/profile/${user.username}`} className="shrink-0">
          <img
            src={user.profile_image || user.avatar || "/default-avatar.png"}
            alt={user.username}
            className={`${avatarSize} rounded-full object-cover hover:opacity-80 transition`}
          />
        </Link>
        <div>
          <Link href={`/profile/${user.username}`} className="hover:underline">
            <p className="font-medium text-gray-900 dark:text-white text-base inline">
              {user.username}
            </p>
          </Link>
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
