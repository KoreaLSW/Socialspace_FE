"use client";

import { useEffect, useRef, useState } from "react";
import { useUserMentionSearch } from "@/hooks/useUserMentionSearch";

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
  prefill?: string; // e.g., "@username " when replying
  replyContext?: {
    parentId?: string;
    replyToCommentId?: string;
    mentionUsername?: string;
  } | null;
  onReplySubmit?: (content: string) => Promise<void>;
  onCancelReply?: () => void;
}

export default function ModalCommentInput({
  user,
  postId,
  onCommentSubmit,
  isLoading = false,
  prefill,
  replyContext,
  onReplySubmit,
  onCancelReply,
}: ModalCommentInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionList, setMentionList] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // 멘션 검색 (SWR 훅 사용)
  const { users: searchedUsers, isLoading: isSearching } = useUserMentionSearch(
    mentionQuery,
    { enabled: mentionOpen, limit: 5, debounceMs: 250 }
  );

  const handleSubmit = async () => {
    if (!content.trim() || isLoading) return;

    try {
      if (replyContext && onReplySubmit) {
        // 대댓글 모드
        await onReplySubmit(content.trim());
      } else if (onCommentSubmit) {
        // 일반 댓글 모드
        await onCommentSubmit(content.trim());
      }

      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);
    }
  };

  // Apply prefill when provided (reply mode)
  useEffect(() => {
    if (prefill !== undefined) {
      setContent((prev) => {
        // If prev already starts with prefill, keep as is
        if (prev.startsWith(prefill)) return prev;
        // If prev is empty or whitespace, replace with prefill
        if (!prev.trim()) return prefill;
        // Otherwise, prepend prefill once
        return `${prefill}${prev}`;
      });
      // Focus and place caret at end
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const len = textareaRef.current.value.length;
          textareaRef.current.selectionStart = len;
          textareaRef.current.selectionEnd = len;
          textareaRef.current.focus();
        }
      });
    }
  }, [prefill]);

  // 대댓글 모드일 때 자동으로 prefill 설정
  useEffect(() => {
    if (replyContext?.mentionUsername && !content) {
      setContent(`@${replyContext.mentionUsername} `);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const len = textareaRef.current.value.length;
          textareaRef.current.selectionStart = len;
          textareaRef.current.selectionEnd = len;
          textareaRef.current.focus();
        }
      });
    }
  }, [replyContext, content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen && mentionList.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % mentionList.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(
          (i) => (i - 1 + mentionList.length) % mentionList.length
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const u = mentionList[activeIndex];
        if (u?.username) insertMention(u.username);
        return;
      }
      if (e.key === "Escape") {
        setMentionOpen(false);
        return;
      }
    }
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return;
      } else {
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

    // 멘션 트리거 파싱(@뒤의 토큰 캡처)
    const caret = e.target.selectionStart || value.length;
    const uptoCaret = value.slice(0, caret);
    const match = uptoCaret.match(/(^|\s)@([\w가-힣_\.]{1,20})$/);
    if (match) {
      const q = match[2];
      setMentionQuery(q);
      setMentionOpen(true);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }

    // 자동 높이 조절
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  useEffect(() => {
    if (mentionOpen) {
      setMentionList(searchedUsers);
      setActiveIndex(0);
    }
  }, [searchedUsers]);

  useEffect(() => {
    if (!mentionOpen) {
      setMentionList([]);
    }
  }, [mentionOpen]);

  const insertMention = (username: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const caret = el.selectionStart || content.length;
    const uptoCaret = content.slice(0, caret);
    const afterCaret = content.slice(caret);
    const replaced = uptoCaret.replace(
      /(^|\s)@([\w가-힣_\.]{1,20})$/,
      `$1@${username} `
    );
    const next = replaced + afterCaret;
    setContent(next);
    setMentionOpen(false);
    setMentionQuery("");
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = replaced.length;
        textareaRef.current.selectionStart = pos;
        textareaRef.current.selectionEnd = pos;
        textareaRef.current.focus();
      }
    });
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-800">
      {/* 대댓글 모드일 때 표시할 헤더 */}
      {replyContext && (
        <div className="mb-3 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {replyContext.mentionUsername
                ? `@${replyContext.mentionUsername}님에게 답글`
                : "답글 작성"}
            </span>
            <button
              onClick={() => {
                onCancelReply?.();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start space-x-2 sm:space-x-3">
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt="프로필 이미지"
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0 mt-1"
          />
        ) : (
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-gray-600 text-xs font-medium">
              {user?.nickname?.charAt(0) || user?.username?.charAt(0) || "사"}
            </span>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <div className="relative w-full">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                replyContext
                  ? "답글 달기... (Shift+Enter로 줄바꿈)"
                  : "댓글 달기... (Shift+Enter로 줄바꿈)"
              }
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm resize-none overflow-hidden min-h-[18px] sm:min-h-[20px] max-h-[80px] sm:max-h-[100px] w-full"
              rows={1}
              disabled={isLoading}
            />
            {mentionOpen && mentionList.length > 0 && (
              <div className="absolute left-0 bottom-full mb-2 max-h-60 w-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-10">
                {mentionList.map((u, idx) => (
                  <button
                    key={u.id}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      idx === activeIndex ? "bg-gray-50 dark:bg-gray-700" : ""
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(u.username);
                    }}
                  >
                    <img
                      src={u.profile_image || "/default-avatar.png"}
                      alt={u.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {u.nickname || u.username}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      @{u.username}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          className="text-blue-500 font-semibold hover:text-blue-600 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mt-1"
        >
          {isLoading ? "게시 중..." : replyContext ? "답글" : "게시"}
        </button>
      </div>
    </div>
  );
}
