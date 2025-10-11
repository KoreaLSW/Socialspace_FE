"use client";

import { useState, useEffect } from "react";
import { X, Users } from "lucide-react";
import { usersApi } from "@/lib/api/users";
import { useChatActions } from "@/hooks/useChat";
import { UiChatRoom } from "@/types/chat";

interface User {
  id: string;
  username: string;
  nickname?: string;
  profile_image?: string;
}

interface CreateGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (room: UiChatRoom) => void;
  currentUserId: string;
}

export default function CreateGroupChatModal({
  isOpen,
  onClose,
  onGroupCreated,
  currentUserId,
}: CreateGroupChatModalProps) {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { createOrGetChatRoom, isLoading } = useChatActions();

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
        // 현재 사용자와 이미 선택된 사용자 제외
        const filtered = results.filter(
          (user) =>
            user.id !== currentUserId &&
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
  }, [searchQuery, currentUserId, selectedUsers]);

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

  // 그룹 생성
  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0) {
      alert("최소 1명 이상의 멤버를 선택해주세요.");
      return;
    }

    if (!groupName.trim()) {
      alert("그룹 이름을 입력해주세요.");
      return;
    }

    try {
      // createGroupRoom API 사용
      const { createGroupRoom } = await import("@/lib/api/chat");
      const memberIds = selectedUsers.map((u) => u.id);

      const room = await createGroupRoom(memberIds, groupName.trim());

      if (onGroupCreated) {
        onGroupCreated(room as UiChatRoom);
      }

      // 초기화
      setGroupName("");
      setSelectedUsers([]);
      setSearchQuery("");
      onClose();
    } catch (error: any) {
      console.error("그룹 생성 실패:", error);
      alert(error.message || "그룹 채팅 생성에 실패했습니다.");
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setGroupName("");
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
          <div className="flex items-center space-x-2">
            <Users className="text-blue-500" size={24} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              새 그룹 채팅
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 그룹 이름 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              그룹 이름 *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="예: 프로젝트 팀, 친구들..."
              maxLength={50}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {groupName.length}/50
            </p>
          </div>

          {/* 멤버 검색 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              멤버 추가 *
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="사용자명 또는 닉네임 입력..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* 선택된 멤버 목록 */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                선택된 멤버 ({selectedUsers.length}명)
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
                      <X size={18} />
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
                      <div className="text-blue-500">+</div>
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

          {/* 안내 메시지 */}
          {selectedUsers.length === 0 && !searchQuery && (
            <div className="text-center py-8">
              <Users
                className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
                size={48}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                그룹에 초대할 멤버를 검색하세요
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                나중에 더 초대할 수도 있습니다
              </p>
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
            onClick={handleCreateGroup}
            disabled={
              selectedUsers.length === 0 || !groupName.trim() || isLoading
            }
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "생성 중..." : "그룹 만들기"}
          </button>
        </div>
      </div>
    </div>
  );
}
