"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  nameForInitial?: string;
  size?: number; // pixel size, default 32
  className?: string;
  profileUsername?: string;
}

export default function UserAvatar({
  src,
  alt = "프로필 이미지",
  nameForInitial,
  size = 32,
  className = "",
  profileUsername,
}: UserAvatarProps) {
  const router = useRouter();
  const initial = nameForInitial?.trim()?.charAt(0)?.toUpperCase();
  const showInitials = !src && !!initial;
  const isClickable = !!profileUsername;
  const commonProps = {
    onClick: isClickable
      ? () => router.push(`/profile/${profileUsername}`)
      : undefined,
    role: isClickable ? "button" : undefined,
    className: `${isClickable ? "cursor-pointer" : ""} ${className}`.trim(),
  } as any;

  if (showInitials) {
    return (
      <div
        className={`rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center select-none ${commonProps.className}`}
        style={{ width: size, height: size }}
        aria-label={alt}
        onClick={commonProps.onClick}
        role={commonProps.role}
      >
        <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
          {initial}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src || "/default-avatar.png"}
      alt={alt}
      className={`rounded-full object-cover ${commonProps.className}`}
      style={{ width: size, height: size }}
      onClick={commonProps.onClick}
      role={commonProps.role}
    />
  );
}
