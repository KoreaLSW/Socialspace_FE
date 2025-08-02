"use client";

import { useState, useRef } from "react";

interface User {
  id?: string;
  email?: string;
  username?: string;
  nickname?: string;
  profileImage?: string;
}

interface ModalCommentInputProps {
  user: User | null;
  postId?: string;
  onCommentSubmit?: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ModalCommentInput({
  user,
  postId,
  onCommentSubmit,
  isLoading = false,
}: ModalCommentInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!content.trim() || isLoading || !onCommentSubmit) return;

    try {
      await onCommentSubmit(content.trim());
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Shift + Enter: 줄바꿈 (기본 동작 유지)
        return;
      } else {
        // Enter: 게시
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // 500자 제한
    if (value.length > 500) {
      return;
    }

    // 30줄 제한
    const lines = value.split("\n");
    if (lines.length > 30) {
      return;
    }

    setContent(value);

    // 자동 높이 조절
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start space-x-3">
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt="프로필 이미지"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-gray-600 text-xs font-medium">
              {user?.nickname?.charAt(0) || user?.username?.charAt(0) || "사"}
            </span>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="댓글 달기... (Shift+Enter로 줄바꿈)"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm resize-none overflow-hidden min-h-[20px] max-h-[100px]"
            rows={1}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          className="text-blue-500 font-semibold hover:text-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mt-1"
        >
          {isLoading ? "게시 중..." : "게시"}
        </button>
      </div>
    </div>
  );
}
