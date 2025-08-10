import React, { memo } from "react";

interface ProfileIdentityProps {
  avatarUrl: string;
  nickname: string;
  username: string;
  className?: string;
}

function ProfileIdentity({
  avatarUrl,
  nickname,
  username,
  className,
}: ProfileIdentityProps) {
  return (
    <div
      className={`flex items-center space-x-4${
        className ? ` ${className}` : ""
      }`}
    >
      <img
        src={avatarUrl}
        alt={username || "프로필"}
        className="w-20 h-20 rounded-full object-cover"
      />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {nickname}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">@{username}</p>
      </div>
    </div>
  );
}

export default memo(ProfileIdentity);
