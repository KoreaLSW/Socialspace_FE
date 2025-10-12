"use client";

import {
  Search as SearchIcon,
  User,
  Hash,
  Clock,
  ArrowLeft,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usersApi } from "@/lib/api/users";
import { postsApi } from "@/lib/api/posts";
import UserAvatar from "@/app/components/common/UserAvatar";
import { ApiPost } from "@/types/post";
import PostModal from "@/app/components/modal/post/PostModal";

interface SearchUser {
  id: string;
  username: string;
  nickname?: string;
  profile_image?: string;
}

interface SearchHashtag {
  id: string;
  name: string;
  post_count: number;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    users: SearchUser[];
    hashtags: SearchHashtag[];
  }>({ users: [], hashtags: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "users" | "hashtags">(
    "all"
  );
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [userSearchHistory, setUserSearchHistory] = useState<string[]>([]);
  const [hashtagSearchHistory, setHashtagSearchHistory] = useState<string[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hashtagPosts, setHashtagPosts] = useState<ApiPost[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ApiPost | null>(null);
  const [isLoadingHashtagPosts, setIsLoadingHashtagPosts] = useState(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 검색 실행 함수
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ users: [], hashtags: [] });
      return;
    }

    setIsLoading(true);
    try {
      const trimmedQuery = query.trim();

      // @로 시작하면 사용자 검색
      if (trimmedQuery.startsWith("@")) {
        const userQuery = trimmedQuery.slice(1);
        const users = await usersApi.search(userQuery, 10);
        setSearchResults({ users, hashtags: [] });
        setActiveTab("users");
      }
      // #으로 시작하면 해시태그 검색
      else if (trimmedQuery.startsWith("#")) {
        const hashtagQuery = trimmedQuery.slice(1);
        const hashtags = await postsApi.searchHashtags(hashtagQuery, 10);
        setSearchResults({ users: [], hashtags });
        setActiveTab("hashtags");
      }
      // 일반 검색 (사용자 + 해시태그)
      else {
        const [users, hashtags] = await Promise.all([
          usersApi.search(trimmedQuery, 5),
          postsApi.searchHashtags(trimmedQuery, 5),
        ]);
        setSearchResults({ users, hashtags });
        setActiveTab("all");
      }
    } catch (error) {
      console.error("검색 에러:", error);
      setSearchResults({ users: [], hashtags: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // 디바운스된 검색
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults({ users: [], hashtags: [] });
      setActiveTab("all");
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // 검색 히스토리 로드
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }

    const savedUserHistory = localStorage.getItem("userSearchHistory");
    if (savedUserHistory) {
      setUserSearchHistory(JSON.parse(savedUserHistory));
    }

    const savedHashtagHistory = localStorage.getItem("hashtagSearchHistory");
    if (savedHashtagHistory) {
      setHashtagSearchHistory(JSON.parse(savedHashtagHistory));
    }
  }, []);

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  // 엔터키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
      saveToSearchHistory(searchQuery);
      // 검색 실행은 이미 디바운스 useEffect에서 처리됨
    }
  };

  // 검색 히스토리 저장 함수
  const saveToSearchHistory = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // 전체 검색 히스토리에 추가
    if (!searchHistory.includes(trimmedQuery)) {
      const newHistory = [trimmedQuery, ...searchHistory.slice(0, 9)];
      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    }

    // 사용자 검색 히스토리
    if (trimmedQuery.startsWith("@")) {
      const userQuery = trimmedQuery.slice(1);
      if (!userSearchHistory.includes(userQuery)) {
        const newUserHistory = [userQuery, ...userSearchHistory.slice(0, 9)];
        setUserSearchHistory(newUserHistory);
        localStorage.setItem(
          "userSearchHistory",
          JSON.stringify(newUserHistory)
        );
      }
    }
    // 해시태그 검색 히스토리
    else if (trimmedQuery.startsWith("#")) {
      const hashtagQuery = trimmedQuery.slice(1);
      if (!hashtagSearchHistory.includes(hashtagQuery)) {
        const newHashtagHistory = [
          hashtagQuery,
          ...hashtagSearchHistory.slice(0, 9),
        ];
        setHashtagSearchHistory(newHashtagHistory);
        localStorage.setItem(
          "hashtagSearchHistory",
          JSON.stringify(newHashtagHistory)
        );
      }
    }
  };

  // 검색 히스토리에서 검색
  const handleHistorySearch = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    saveToSearchHistory(query);
  };

  // 사용자 히스토리에서 검색
  const handleUserHistorySearch = (query: string) => {
    const fullQuery = `@${query}`;
    setSearchQuery(fullQuery);
    setShowSuggestions(false);
    saveToSearchHistory(fullQuery);
  };

  // 해시태그 히스토리에서 검색
  const handleHashtagHistorySearch = (query: string) => {
    const fullQuery = `#${query}`;
    setSearchQuery(fullQuery);
    setShowSuggestions(false);
    saveToSearchHistory(fullQuery);
  };

  // 전체 검색 히스토리 삭제
  const handleDeleteSearchHistory = (
    e: React.MouseEvent,
    queryToDelete: string
  ) => {
    e.stopPropagation(); // 부모 버튼의 onClick 이벤트 방지
    const newHistory = searchHistory.filter((q) => q !== queryToDelete);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  // 사용자 검색 히스토리 삭제
  const handleDeleteUserHistory = (
    e: React.MouseEvent,
    queryToDelete: string
  ) => {
    e.stopPropagation();
    const newHistory = userSearchHistory.filter((q) => q !== queryToDelete);
    setUserSearchHistory(newHistory);
    localStorage.setItem("userSearchHistory", JSON.stringify(newHistory));
  };

  // 해시태그 검색 히스토리 삭제
  const handleDeleteHashtagHistory = (
    e: React.MouseEvent,
    queryToDelete: string
  ) => {
    e.stopPropagation();
    const newHistory = hashtagSearchHistory.filter((q) => q !== queryToDelete);
    setHashtagSearchHistory(newHistory);
    localStorage.setItem("hashtagSearchHistory", JSON.stringify(newHistory));
  };

  // 해시태그 클릭 핸들러
  const handleHashtagClick = async (hashtagId: string, hashtagName: string) => {
    setIsLoadingHashtagPosts(true);
    setSelectedHashtag(hashtagName);
    setHashtagPosts([]);

    try {
      const response = await postsApi.getByHashtagPaginated(hashtagId, 1, 20);
      setHashtagPosts(response.data || []);
    } catch (error) {
      console.error("해시태그 게시물 조회 에러:", error);
      setHashtagPosts([]);
    } finally {
      setIsLoadingHashtagPosts(false);
    }
  };

  // 게시물 클릭 핸들러
  const handlePostClick = (post: ApiPost) => {
    setSelectedPost(post);
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
    setSelectedHashtag(null);
    setHashtagPosts([]);
    setSelectedPost(null);
  };

  return (
    <>
      {/* 검색 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          검색
        </h1>

        {/* 검색바 */}
        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="@사용자명, #해시태그 또는 일반 검색..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(searchQuery.length > 0)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-full outline-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
          />

          {/* 검색 제안 드롭다운 */}
          {showSuggestions && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock size={16} />
                  <span>최근 검색어</span>
                </div>
              </div>
              {searchHistory.slice(0, 5).map((query, index) => (
                <div
                  key={index}
                  className="w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleHistorySearch(query)}
                      className="flex items-center space-x-2 flex-1"
                    >
                      <SearchIcon size={16} className="text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {query}
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteSearchHistory(e, query)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                    >
                      <X
                        size={16}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      {(searchQuery.trim() || isLoading) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          {/* 검색 결과 탭 */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "all"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "users"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              사용자
            </button>
            <button
              onClick={() => setActiveTab("hashtags")}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "hashtags"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              해시태그
            </button>
          </div>

          {/* 검색 결과 내용 */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  검색 중...
                </span>
              </div>
            ) : (
              <>
                {/* 사용자 결과 */}
                {(activeTab === "all" || activeTab === "users") &&
                  searchResults.users.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <User size={20} className="mr-2" />
                        사용자 ({searchResults.users.length})
                      </h3>
                      <div className="space-y-3">
                        {searchResults.users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <UserAvatar
                              src={user.profile_image}
                              nameForInitial={user.nickname || user.username}
                              size={40}
                              profileUsername={user.username}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.nickname || user.username}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 해시태그 결과 */}
                {(activeTab === "all" || activeTab === "hashtags") &&
                  searchResults.hashtags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Hash size={20} className="mr-2" />
                        해시태그 ({searchResults.hashtags.length})
                      </h3>
                      <div className="space-y-3">
                        {searchResults.hashtags.map((hashtag) => (
                          <button
                            key={hashtag.id}
                            onClick={() =>
                              handleHashtagClick(hashtag.id, hashtag.name)
                            }
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                          >
                            <div>
                              <p className="font-medium text-blue-600 dark:text-blue-400">
                                #{hashtag.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {hashtag.post_count.toLocaleString()}개의 게시물
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 검색 결과 없음 */}
                {!isLoading &&
                  searchResults.users.length === 0 &&
                  searchResults.hashtags.length === 0 &&
                  searchQuery.trim() && (
                    <div className="text-center py-8">
                      <SearchIcon
                        size={48}
                        className="mx-auto text-gray-300 dark:text-gray-600 mb-4"
                      />
                      <p className="text-gray-500 dark:text-gray-400">
                        "{searchQuery}"에 대한 검색 결과가 없습니다.
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 해시태그 게시물 리스트 */}
      {selectedHashtag && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          {/* 헤더 */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  #{selectedHashtag}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {hashtagPosts.length}개의 게시물
                </p>
              </div>
            </div>
          </div>

          {/* 게시물 리스트 */}
          <div className="p-6">
            {isLoadingHashtagPosts ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  게시물 로딩 중...
                </span>
              </div>
            ) : hashtagPosts.length > 0 ? (
              <div className="space-y-4">
                {hashtagPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handlePostClick(post)}
                    className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <UserAvatar
                        src={post.author?.profileImage}
                        nameForInitial={
                          post.author?.nickname ||
                          post.author?.username ||
                          "익명"
                        }
                        size={40}
                        profileUsername={post.author?.username}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {post.author?.nickname ||
                              post.author?.username ||
                              "익명"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{post.author?.username || "unknown"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ·
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-gray-900 dark:text-white mb-2 line-clamp-3">
                          {post.content}
                        </p>
                        {post.images && post.images.length > 0 && (
                          <div className="flex space-x-2 mb-2">
                            {post.images.slice(0, 3).map((image, index) => (
                              <img
                                key={index}
                                src={image.image_url}
                                alt={`게시물 이미지 ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ))}
                            {post.images.length > 3 && (
                              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{post.images.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>좋아요 {post.like_count || 0}</span>
                          <span>댓글 {post.comment_count || 0}</span>
                          <span>조회 {post.view_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  #{selectedHashtag} 관련 게시물이 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 검색 히스토리 */}
      {!searchQuery.trim() && !selectedHashtag && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              최근 검색어
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 사용자 검색 히스토리 */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <User className="text-green-500" size={18} />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  사용자
                </h3>
              </div>
              {userSearchHistory.length > 0 ? (
                <div className="space-y-2">
                  {userSearchHistory.slice(0, 5).map((query, index) => (
                    <div
                      key={index}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleUserHistorySearch(query)}
                          className="flex items-center space-x-2 flex-1"
                        >
                          <User size={16} className="text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            @{query}
                          </span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteUserHistory(e, query)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-full transition-colors"
                        >
                          <X
                            size={16}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  사용자 검색 기록이 없습니다
                </p>
              )}
            </div>

            {/* 해시태그 검색 히스토리 */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Hash className="text-blue-500" size={18} />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  해시태그
                </h3>
              </div>
              {hashtagSearchHistory.length > 0 ? (
                <div className="space-y-2">
                  {hashtagSearchHistory.slice(0, 5).map((query, index) => (
                    <div
                      key={index}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleHashtagHistorySearch(query)}
                          className="flex items-center space-x-2 flex-1"
                        >
                          <Hash size={16} className="text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            #{query}
                          </span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteHashtagHistory(e, query)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-full transition-colors"
                        >
                          <X
                            size={16}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  해시태그 검색 기록이 없습니다
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 게시물 상세 모달 */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}
