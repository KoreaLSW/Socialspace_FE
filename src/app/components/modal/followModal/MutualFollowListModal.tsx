"use client";

import { useState } from "react";
import { X, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useMutualFollows } from "@/hooks/useMutualFollows";
import UserListItem from "../../follow/UserListItem";

interface MutualFollowListModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

export default function MutualFollowListModal({
  open,
  onClose,
  userId,
  username,
}: MutualFollowListModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { users, pagination, isLoading, error } = useMutualFollows(
    open ? userId : null,
    currentPage,
    20
  );

  if (!open) return null;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Users className="text-blue-500" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                맞팔로우
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              로딩 중...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              오류가 발생했습니다.
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              맞팔로우가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  avatarSize="w-10 h-10"
                  showNickname={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              <span>이전</span>
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentPage} / {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>다음</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
