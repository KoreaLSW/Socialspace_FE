"use client";

import { User } from "lucide-react";

interface PostCreatorProps {
  user?: any;
  onPostClick?: () => void;
}

export default function PostCreator({ user, onPostClick }: PostCreatorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
          {user?.profileImage ? (
            <img
              src={user.profileImage || user.image}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <User className="text-white" size={20} />
          )}
        </div>
        <input
          type="text"
          placeholder={
            user
              ? "무슨 일이 일어나고 있나요?"
              : "로그인 후 게시글을 작성하세요"
          }
          className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 outline-none text-gray-900 dark:text-white placeholder-gray-500"
          disabled={!user}
          onClick={onPostClick}
          readOnly
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!user}
          onClick={onPostClick}
        >
          게시
        </button>
      </div>
    </div>
  );
}
