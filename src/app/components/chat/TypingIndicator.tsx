"use client";

import { TypingIndicatorProps } from "@/types/chat";

export default function TypingIndicator({
  typingUsers,
  currentUserId,
  maxDisplay = 3,
}: TypingIndicatorProps) {
  const filteredUsers = typingUsers.filter(
    (userId) => userId !== currentUserId
  );

  if (filteredUsers.length === 0) return null;

  const displayUsers = filteredUsers.slice(0, maxDisplay);
  const remainingCount = filteredUsers.length - maxDisplay;

  const getTypingText = () => {
    if (displayUsers.length === 1) {
      return "입력 중...";
    } else if (displayUsers.length <= maxDisplay) {
      return `${displayUsers.length}명이 입력 중...`;
    } else {
      return `${maxDisplay}명 외 ${remainingCount}명이 입력 중...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 text-gray-500 text-sm px-4 py-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}
