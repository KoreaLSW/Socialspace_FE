"use client";

import { useState } from "react";
import { X, UserX, Users, UserCheck } from "lucide-react";
import { useBlockedUsers, useBlockActions } from "@/hooks/useBlocks";
import UserAvatar from "@/app/components/common/UserAvatar";

interface BlockedUsersModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BlockedUsersModal({
  open,
  onClose,
}: BlockedUsersModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });
  const { blockedUsers, pagination, isLoading, mutate } = useBlockedUsers(
    currentPage,
    20
  );
  const { unblockUser, isLoading: isUnblocking } = useBlockActions();

  const handleUnblockUser = async (userId: string, nickname: string) => {
    if (confirm(`${nickname}님을 차단 해제하시겠습니까?`)) {
      try {
        await unblockUser(userId);
        await mutate(); // 목록 새로고침
        setToast({
          visible: true,
          message: "차단을 해제했습니다",
          type: "success",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
      } catch (error) {
        setToast({
          visible: true,
          message: "차단 해제 중 오류가 발생했습니다",
          type: "error",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <UserX className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              차단 친구 관리
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && blockedUsers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                차단한 사용자가 없습니다
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                차단한 사용자가 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {blockedUsers.map((blockedUser) => (
                <div
                  key={blockedUser.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      src={blockedUser.profile_image}
                      alt={blockedUser.nickname}
                      size={40}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {blockedUser.nickname}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>@{blockedUser.username}</span>
                        <span>•</span>
                        <span>
                          팔로워 {blockedUser.followers_count.toLocaleString()}
                          명
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(blockedUser.blocked_since).toLocaleDateString(
                          "ko-KR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                        에 차단됨
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleUnblockUser(blockedUser.id, blockedUser.nickname)
                    }
                    disabled={isUnblocking}
                    className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <UserCheck size={16} />
                    <span className="text-sm">차단 해제</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            차단한 사용자는 회원님을 팔로우하거나 게시물을 볼 수 없습니다
          </p>
        </div>

        {/* Toast */}
        {toast.visible && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60]">
            <div
              className={`px-4 py-2 rounded-lg shadow-lg text-white text-sm ${
                toast.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
