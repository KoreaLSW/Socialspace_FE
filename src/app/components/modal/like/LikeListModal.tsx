"use client";

import React, { useCallback, useRef, useEffect } from "react";
import UserList from "@/app/components/follow/UserList";
import { useLikeList } from "@/hooks/useLikeList";

interface LikeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  commentId?: string;
}

export default function LikeListModal({
  isOpen,
  onClose,
  postId,
  commentId,
}: LikeListModalProps) {
  // 1. 모든 Hooks를 먼저 호출
  const {
    users,
    isLoading,
    isValidating,
    hasMore,
    size,
    setSize,
    invalidateCache,
  } = useLikeList({
    isOpen,
    postId,
    commentId,
    limit: 10,
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 2. useEffect를 Hook 호출 이후에 배치
  useEffect(() => {
    if (isOpen && invalidateCache) {
      invalidateCache();
    }
  }, [isOpen, invalidateCache]);

  // 3. useCallback을 Hook 호출 이후에 배치
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasMore || isValidating) return;
    const threshold = el.scrollHeight - el.clientHeight - 120;
    if (el.scrollTop > threshold) setSize(size + 1);
  }, [hasMore, isValidating, size, setSize]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md h-[70vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white font-semibold">
            좋아요
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            닫기
          </button>
        </div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="p-4 overflow-y-auto h-[calc(70vh-56px)]"
        >
          {isLoading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              불러오는 중...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              목록이 비어 있습니다.
            </div>
          ) : (
            <>
              <UserList
                users={users}
                avatarSize="w-10 h-10"
                showNickname={true}
              />
              <div className="py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                {isValidating
                  ? "더 불러오는 중..."
                  : hasMore
                  ? "스크롤해서 더 보기"
                  : "모든 목록을 불러왔습니다"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
