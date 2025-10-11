"use client";

import { useState, useEffect } from "react";
import { usersApi } from "@/lib/api/users";
import { useChatActions } from "@/hooks/useChat";

interface User {
  id: string;
  username: string;
  nickname?: string;
  profile_image?: string;
}

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  currentMembers: string[]; // 현재 채팅방 멤버 ID 목록
}

export default function InviteMembersModal({
  isOpen,
  onClose,
  roomId,
  currentMembers,
}: InviteMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { addMembers, isLoading } = useChatActions();

  // 사용자 검색
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await usersApi.search(searchQuery, 10);
        // 현재 멤버와 이미 선택된 사용자 제외
        const filtered = results.filter(
          (user) =>
            !currentMembers.includes(user.id) &&
            !selectedUsers.some((u) => u.id === user.id)
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error("사용자 검색 실패:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentMembers, selectedUsers]);

  // 사용자 선택
  const handleSelectUser = (user: User) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchQuery("");
    setSearchResults([]);
  };

  // 사용자 선택 해제
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // 초대하기
  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const userIds = selectedUsers.map((u) => u.id);
      await addMembers(roomId, userIds);
      alert(`${selectedUsers.length}명을 초대했습니다.`);
      setSelectedUsers([]);
      onClose();
    } catch (error: any) {
      console.error("멤버 초대 실패:", error);
      alert(error.message || "멤버 초대에 실패했습니다.");
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            멤버 초대
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 검색 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              사용자 검색
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="사용자명 또는 닉네임 입력..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* 선택된 사용자 목록 */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                선택된 사용자 ({selectedUsers.length}명)
              </label>
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <img
                        src={user.profile_image || "/default-avatar.png"}
                        alt={user.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.nickname || user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 검색 결과 */}
          {searchQuery && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                검색 결과
              </label>
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <img
                        src={user.profile_image || "/default-avatar.png"}
                        alt={user.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.nickname || user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  검색 결과가 없습니다.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleInvite}
            disabled={selectedUsers.length === 0 || isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "초대 중..." : `초대 (${selectedUsers.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

