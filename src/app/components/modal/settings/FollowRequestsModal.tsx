"use client";

import { useState } from "react";
import { X, UserPlus, Users, Check, UserX } from "lucide-react";
import { followApi } from "@/lib/api/follows";
import UserAvatar from "@/app/components/common/UserAvatar";
import useSWR, { mutate as globalMutate } from "swr";

interface FollowRequestsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function FollowRequestsModal({
  open,
  onClose,
}: FollowRequestsModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const { data, error, isLoading, mutate } = useSWR(
    open ? `/follow-requests?page=${currentPage}&limit=20` : null,
    () => followApi.getFollowRequests(currentPage, 20),
    {
      revalidateOnFocus: false,
    }
  );

  const requests = data?.data || [];
  const pagination = data?.pagination;

  const handleApprove = async (requesterId: string, nickname: string) => {
    if (processingIds.has(requesterId)) return;

    setProcessingIds((prev) => new Set(prev).add(requesterId));
    try {
      await followApi.approveFollowRequest(requesterId);
      await mutate(); // 목록 새로고침
      // 카운트 캐시도 무효화
      globalMutate("/follow-requests-count");
      setToast({
        visible: true,
        message: `${nickname}님의 팔로우 요청을 승인했습니다`,
        type: "success",
      });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
    } catch (error) {
      setToast({
        visible: true,
        message: "요청 승인 중 오류가 발생했습니다",
        type: "error",
      });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requesterId);
        return newSet;
      });
    }
  };

  const handleReject = async (requesterId: string, nickname: string) => {
    if (processingIds.has(requesterId)) return;

    if (confirm(`${nickname}님의 팔로우 요청을 거절하시겠습니까?`)) {
      setProcessingIds((prev) => new Set(prev).add(requesterId));
      try {
        await followApi.rejectFollowRequest(requesterId);
        await mutate(); // 목록 새로고침
        // 카운트 캐시도 무효화
        globalMutate("/follow-requests-count");
        setToast({
          visible: true,
          message: `${nickname}님의 팔로우 요청을 거절했습니다`,
          type: "success",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
      } catch (error) {
        setToast({
          visible: true,
          message: "요청 거절 중 오류가 발생했습니다",
          type: "error",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
      } finally {
        setProcessingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(requesterId);
          return newSet;
        });
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              팔로우 요청 관리
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
          {isLoading && requests.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                받은 팔로우 요청이 없습니다
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                새로운 팔로우 요청이 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      src={request.profile_image}
                      alt={request.nickname}
                      size={40}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.nickname}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>@{request.username}</span>
                        <span>•</span>
                        <span>
                          팔로워 {request.followers_count.toLocaleString()}명
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(request.requested_at).toLocaleDateString(
                          "ko-KR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                        에 요청됨
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleApprove(request.id, request.nickname)
                      }
                      disabled={processingIds.has(request.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      <Check size={16} />
                      <span className="text-sm">승인</span>
                    </button>
                    <button
                      onClick={() => handleReject(request.id, request.nickname)}
                      disabled={processingIds.has(request.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <UserX size={16} />
                      <span className="text-sm">거절</span>
                    </button>
                  </div>
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
            승인된 사용자만 회원님의 게시물을 볼 수 있습니다
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
