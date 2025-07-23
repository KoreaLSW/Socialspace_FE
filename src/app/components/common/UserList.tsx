import React from "react";
import Link from "next/link";

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
        <li
          key={user.id}
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded shadow"
        >
          <div className="flex items-center space-x-4">
            <Link href={`/profile/${user.username}`} className="shrink-0">
              <img
                src={user.profile_image || user.avatar || "/default-avatar.png"}
                alt={user.username}
                className={`${avatarSize} rounded-full object-cover hover:opacity-80 transition`}
              />
            </Link>
            <div>
              <Link
                href={`/profile/${user.username}`}
                className="hover:underline"
              >
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
          <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            팔로우
          </button>
        </li>
      ))}
    </ul>
  );
}
