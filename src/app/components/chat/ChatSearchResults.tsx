"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MessageSquare, Users, ArrowRight } from "lucide-react";
import { ChatRoom } from "@/lib/api/chat";
import UserAvatar from "@/app/components/common/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useChatRoomSearch } from "@/hooks/useChatSearch";

interface ChatSearchResultsProps {
  searchQuery: string;
  onRoomSelect: (
    room: ChatRoom & { message_count: number },
    searchQuery: string
  ) => void;
  onClose: () => void;
}

interface SearchRoomItem extends ChatRoom {
  message_count: number;
}

export default function ChatSearchResults({
  searchQuery,
  onRoomSelect,
  onClose,
}: ChatSearchResultsProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // 디버깅 로그
  console.log("🔍 ChatSearchResults 상태:", {
    searchQuery,
    localSearchQuery,
    debouncedQuery,
  });

  // 검색어 디바운스 처리
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(localSearchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [localSearchQuery]);

  // 컴포넌트 마운트 시 입력 필드에 자동 포커스
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // 커서를 텍스트 끝으로 이동
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, []);

  // SWR을 사용한 검색
  const { searchResults, isLoading, error } = useChatRoomSearch(
    debouncedQuery,
    1,
    20
  );

  // 대화방 이름 생성
  const getRoomDisplayName = (room: SearchRoomItem) => {
    if (room.is_group && room.name) {
      return room.name;
    }

    // 1:1 채팅의 경우 상대방 이름
    const otherMember = room.members?.find(
      (member) => member.user_id !== "current_user_id"
    );
    return (
      otherMember?.user?.nickname ||
      otherMember?.user?.username ||
      "알 수 없는 사용자"
    );
  };

  // 대화방 아바타 생성
  const getRoomAvatar = (room: SearchRoomItem) => {
    if (room.is_group) {
      return null; // 그룹 채팅은 기본 아이콘 사용
    }

    // 1:1 채팅의 경우 상대방 프로필 이미지
    const otherMember = room.members?.find(
      (member) => member.user_id !== "current_user_id"
    );
    return otherMember?.user?.profile_image || null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-[600px] flex flex-col">
      {/* 검색 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            메시지 검색
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* 검색 입력 */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            ref={inputRef}
            type="text"
            value={localSearchQuery}
            onChange={(e) => {
              setLocalSearchQuery(e.target.value);
            }}
            placeholder="검색할 메시지 입력..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-red-500">
            <p className="text-sm">검색 중 오류가 발생했습니다.</p>
            <p className="text-xs text-gray-500 mt-1">
              {error?.message || "알 수 없는 오류"}
            </p>
          </div>
        ) : searchResults ? (
          <div>
            {/* 검색 결과 헤더 */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                메시지 {searchResults.total}
              </p>
            </div>

            {/* 대화방 목록 */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => onRoomSelect(room, debouncedQuery)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {/* 아바타 */}
                    <div className="flex-shrink-0">
                      {room.is_group ? (
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Users
                            size={20}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </div>
                      ) : (
                        <UserAvatar
                          user={{
                            profile_image: getRoomAvatar(room),
                            username: "",
                            nickname: "",
                          }}
                          size={48}
                        />
                      )}
                    </div>

                    {/* 대화방 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {getRoomDisplayName(room)}
                        </h3>
                        <ArrowRight
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {room.message_count}개의 메시지
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 검색 결과가 없는 경우 */}
            {searchResults.rooms.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                <MessageSquare size={32} className="mb-2" />
                <p className="text-sm">검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <Search size={32} className="mb-2" />
            <p className="text-sm">검색어를 입력하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
