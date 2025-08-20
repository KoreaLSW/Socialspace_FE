"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUserProfile } from "@/hooks/useProfile";
import { useUserPosts } from "@/hooks/usePosts";

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

      {/* 탭별 콘텐츠 - 지연 로딩 적용 */}
      {activeTab === "posts" && (
        <UserPostsList userId={profile.id} type="posts" />
      )}
      {activeTab === "media" && (
        <UserPostsList userId={profile.id} type="media" />
      )}
      {activeTab === "likes" && (
        <UserPostsList userId={profile.id} type="likes" />
      )}
    </>
  );
}

// 사용자 게시물 목록 컴포넌트 - 커스텀 훅 사용
function UserPostsList({
  userId,
  type,
}: {
  userId: string;
  type: "posts" | "media" | "likes";
}) {
  const {
    posts,
    isLoading,
    error,
    hasMore,
    isValidating,
    mutate: mutateUserPosts,
    size,
    setSize,
  } = useUserPosts({ userId, type });

  const loadMore = () => setSize(size + 1);
  const isLoadingMore = isValidating && size > 0;
  return (
    <PostGrid
      posts={posts}
      isLoading={isLoadingMore}
      isInitialLoading={isLoading}
      error={error}
      hasMore={hasMore}
      onLoadMore={loadMore}
      mutateUserPosts={mutateUserPosts}
      type={type}
    />
  );
}
