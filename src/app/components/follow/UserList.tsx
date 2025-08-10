"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useFollowActions, useFollowStatus } from "@/hooks/useFollow";
import UserListItem from "./UserListItem";

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
