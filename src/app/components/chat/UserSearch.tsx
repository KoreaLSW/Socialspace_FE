"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Users } from "lucide-react";
import { UserSearchProps, UserSearchResult } from "@/types/chat";
import UserAvatar from "@/app/components/common/UserAvatar";
import { useDebounce } from "@/hooks/useDebounce";
import { expressApi } from "@/lib/api/config";

export default function UserSearch({
  onUserSelect,
  placeholder = "사용자 검색...",
  showMutualFollows = true,
  excludeUserIds = [],
}: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 사용자 검색 API 호출
  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await expressApi.get("/users/search", {
        params: {
          q: searchQuery,
          limit: 20,
          exclude: excludeUserIds.join(","),
        },
      });

      if (response.data.success) {
        setResults(response.data.data || []);
      }
    } catch (error) {
      console.error("사용자 검색 실패:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 디바운스된 검색어로 API 호출
  useEffect(() => {
    if (debouncedQuery) {
      searchUsers(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
  };

  const handleUserSelect = (user: UserSearchResult) => {
    onUserSelect(user);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (query.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={searchRef} className="relative">
      {/* 검색 입력 */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-700 rounded-full outline-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">검색 중...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                >
                  <UserAvatar
                    src={user.profileImage}
                    alt={user.nickname || user.username}
                    size={40}
                  />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.nickname || user.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </p>
                    {showMutualFollows &&
                      user.mutualFollowCount &&
                      user.mutualFollowCount > 0 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Users size={12} className="text-blue-500" />
                          <span className="text-xs text-blue-500">
                            맞팔로우 {user.mutualFollowCount}명
                          </span>
                        </div>
                      )}
                  </div>
                  {user.isFollowing && (
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                      팔로잉
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : query.trim() && !isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
