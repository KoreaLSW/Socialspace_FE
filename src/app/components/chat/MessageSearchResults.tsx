"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";
import { ChatMessage } from "@/lib/api/chat";
import UserAvatar from "@/app/components/common/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useMessageSearch } from "@/hooks/useChatSearch";

interface MessageSearchResultsProps {
  roomId: string;
  roomName: string;
  searchQuery: string;
  onMessageSelect: (message: ChatMessage) => void;
  onBack: () => void;
  onClose: () => void;
}

export default function MessageSearchResults({
  roomId,
  roomName,
  searchQuery,
  onMessageSelect,
  onBack,
  onClose,
}: MessageSearchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<
    number | null
  >(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery || "");
  const inputRef = useRef<HTMLInputElement>(null);

  // 디버깅을 위한 로그
  console.log("MessageSearchResults props:", { roomId, roomName, searchQuery });

  // searchQuery가 변경되면 로컬 상태도 업데이트 (즉시 설정)
  useEffect(() => {
    if (searchQuery && searchQuery !== localSearchQuery) {
      setLocalSearchQuery(searchQuery);
      setDebouncedQuery(searchQuery);
    }
  }, [searchQuery, localSearchQuery]);

  const limit = 50;

  // 검색어 디바운스 처리 (초기 검색어는 즉시 적용)
  useEffect(() => {
    // 초기 검색어가 있으면 즉시 적용
    if (
      searchQuery &&
      searchQuery === localSearchQuery &&
      searchQuery === debouncedQuery
    ) {
      return; // 이미 적용됨
    }

    const timeout = setTimeout(
      () => {
        setDebouncedQuery(localSearchQuery);
        setCurrentPage(1); // 검색어가 변경되면 첫 페이지로
      },
      searchQuery && localSearchQuery === searchQuery ? 0 : 300
    ); // 초기 검색어는 즉시

    return () => clearTimeout(timeout);
  }, [localSearchQuery, searchQuery, debouncedQuery]);

  // 컴포넌트 마운트 시 입력 필드에 자동 포커스
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // 커서를 텍스트 끝으로 이동
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, []);

  // 검색어가 있으면 검색 결과 표시 (초기 검색어 포함)
  const shouldShowResults =
    (debouncedQuery && debouncedQuery.trim()) ||
    (searchQuery && searchQuery.trim());

  // SWR을 사용한 검색 (검색어가 있을 때만)
  const searchQueryForApi = debouncedQuery || searchQuery;
  const { searchResults, isLoading, error } = useMessageSearch(
    roomId,
    searchQueryForApi,
    currentPage,
    limit
  );

  // 디버깅 로그
  console.log("🔍 MessageSearchResults 검색 상태:", {
    roomId,
    searchQuery,
    localSearchQuery,
    debouncedQuery,
    searchQueryForApi,
    shouldShowResults,
    searchResults: searchResults?.messages?.length,
    searchResultsData: searchResults,
    isLoading,
    error,
  });

  // 검색어 표시용 (로컬 검색어 사용)
  const displayQuery = localSearchQuery || searchQuery;

  // 메시지 내용에서 검색어 하이라이트
  const highlightSearchQuery = (content: string, query: string) => {
    if (!query.trim()) return content;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = content.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          className="bg-green-200 dark:bg-green-800 px-1 rounded"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // 메시지 선택
  const handleMessageClick = (message: ChatMessage) => {
    onMessageSelect(message);
    onClose();
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}.${String(date.getDate()).padStart(2, "0")} ${String(
        date.getHours()
      ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-[600px] flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 truncate">
            {roomName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="flex-1 overflow-y-auto">
        {!shouldShowResults ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <Search size={32} className="mb-2" />
            <p className="text-sm">검색어를 입력하세요.</p>
          </div>
        ) : isLoading ? (
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
                "{displayQuery}" 검색 결과 - {searchResults.total}개의 메시지
                발견
              </p>
            </div>

            {/* 메시지 목록 */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.messages.map((message, index) => (
                <button
                  key={message.id}
                  onClick={() => handleMessageClick(message)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedMessageIndex === index
                      ? "bg-blue-50 dark:bg-blue-900"
                      : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* 프로필 이미지 */}
                    <div className="flex-shrink-0">
                      <UserAvatar
                        src={message.sender?.profile_image || null}
                        nameForInitial={
                          message.sender?.nickname ||
                          message.sender?.username ||
                          "알 수 없음"
                        }
                        size={32}
                      />
                    </div>

                    {/* 메시지 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {message.sender?.nickname ||
                            message.sender?.username ||
                            "알 수 없음"}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(message.created_at.toString())}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                        {highlightSearchQuery(message.content, displayQuery)}
                      </p>
                    </div>

                    {/* 화살표 아이콘 */}
                    <div className="flex-shrink-0">
                      <ArrowRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 검색 결과가 없는 경우 */}
            {searchResults.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                <Search size={32} className="mb-2" />
                <p className="text-sm">검색 결과가 없습니다.</p>
              </div>
            )}

            {/* 페이지네이션 */}
            {searchResults.total > limit && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentPage} / {Math.ceil(searchResults.total / limit)}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={
                      currentPage >= Math.ceil(searchResults.total / limit)
                    }
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <Search size={32} className="mb-2" />
            <p className="text-sm">검색 결과를 불러오는 중...</p>
          </div>
        )}
      </div>
    </div>
  );
}
