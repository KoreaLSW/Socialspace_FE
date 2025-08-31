"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import UserAvatar from "../common/UserAvatar";
import UserNickName from "../common/UserNickName";
import FollowButton from "../common/FollowButton";

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
        <FollowButton
          targetUserId={user.id}
          variant="small"
          unfollowText="취소"
        />
      )}
    </li>
  );
}
