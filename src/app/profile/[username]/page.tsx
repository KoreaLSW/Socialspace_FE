"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUserProfile } from "@/hooks/useProfile";
import useSWR from "swr";
import { fetcher } from "@/lib/api/config";
import { Post } from "@/types/post";

// 컴포넌트 import
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileTabs from "../../components/profile/ProfileTabs";
import PostGrid from "../../components/profile/PostGrid";

export default function UserProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const { profile, isLoading, error } = useUserProfile(username);
  const [activeTab, setActiveTab] = useState("posts");

  // 로딩 중이면 로딩 UI 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 에러가 있는 경우
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error
              ? "프로필을 불러오는데 실패했습니다."
              : "사용자를 찾을 수 없습니다."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 프로필 헤더 */}
      <ProfileHeader profile={profile} />

      {/* 탭 메뉴 */}
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 탭별 콘텐츠 */}
      {activeTab === "posts" && <UserPostsList userId={profile.id} />}
      {activeTab === "media" && <MediaTab />}
      {activeTab === "likes" && <LikesTab />}
    </>
  );
}

// 사용자 게시물 목록 컴포넌트
function UserPostsList({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, error, isLoading } = useSWR(
    `/posts/user/${userId}?page=${page}&limit=12`,
    fetcher
  );

  // 초기 로딩 시 게시물 설정
  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllPosts(data.data);
      } else {
        setAllPosts((prev) => [...prev, ...data.data]);
      }

      // 더 불러올 게시물이 있는지 확인
      const totalPages = data.pagination?.totalPages || 1;
      setHasMore(page < totalPages);
    }
  }, [data, page]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (data && !isLoading && isLoadingMore) {
      const timer = setTimeout(() => {
        setIsLoadingMore(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [data, isLoading, isLoadingMore]);

  return (
    <PostGrid
      posts={allPosts}
      isLoading={isLoadingMore}
      isInitialLoading={isLoading && allPosts.length === 0}
      error={error}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
    />
  );
}

// 미디어 탭 컴포넌트
function MediaTab() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
      <p className="text-gray-500 dark:text-gray-400">
        미디어 기능은 준비 중입니다.
      </p>
    </div>
  );
}

// 좋아요 탭 컴포넌트
function LikesTab() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
      <p className="text-gray-500 dark:text-gray-400">
        좋아요 기능은 준비 중입니다.
      </p>
    </div>
  );
}
