"use client";

import { useState, useEffect, useCallback } from "react";
import { useMyProfile } from "@/hooks/useProfile";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/api/config";
import { Post } from "@/types/post";

// 컴포넌트 import
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import PostGrid from "../components/profile/PostGrid";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { profile, isLoading, error } = useMyProfile();
  const [activeTab, setActiveTab] = useState("posts");

  // 인증 체크
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      alert("로그인이 필요합니다.");
      router.push("/auth/login");
    }
  }, [session, status, router]);

  // 로딩 중이면 로딩 UI 표시
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음
  if (!session) {
    return null;
  }

  // 에러가 있는 경우
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">프로필을 불러오는데 실패했습니다.</p>
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
      {activeTab === "posts" && <MyPostsList />}
      {activeTab === "media" && <MediaTab />}
      {activeTab === "likes" && <LikesTab />}
    </>
  );
}

// 내 게시물 목록 컴포넌트
function MyPostsList() {
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    `/posts/my?page=${page}&limit=12`,
    fetcher
  );

  // 초기 로딩 시 게시물 설정
  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllPosts(data.data);
      } else {
        // 스크롤 위치 유지를 위해 키를 사용한 안정적인 렌더링
        setAllPosts((prev) => {
          const newPosts = [...prev, ...data.data];
          return newPosts;
        });
      }

      // 더 불러올 게시물이 있는지 확인 (페이지네이션 정보 사용)
      const totalPages = data.pagination?.totalPages || 1;
      setHasMore(page < totalPages);
    }
  }, [data, page]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMore, isLoading]);

  // 로딩 상태가 완료되면 스크롤 위치 복원을 위한 지연
  useEffect(() => {
    if (data && !isLoading && isLoadingMore) {
      // DOM 업데이트 완료 후 로딩 상태 해제
      const timer = setTimeout(() => {
        setIsLoadingMore(false);
      }, 150); // 자연스러운 전환을 위해 적절한 지연

      return () => clearTimeout(timer);
    }
  }, [data, isLoading, isLoadingMore]);

  // 로딩 상태 업데이트
  useEffect(() => {
    if (data && !isLoading) {
      setIsLoadingMore(false);
    }
  }, [data, isLoading]);

  return (
    <PostGrid
      posts={allPosts}
      isLoading={isLoadingMore} // 추가 로딩 상태만 전달
      isInitialLoading={isLoading && allPosts.length === 0} // 초기 로딩 상태
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
