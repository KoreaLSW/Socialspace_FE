"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUserProfile } from "@/hooks/useProfile";
import { useUserPosts } from "@/hooks/usePosts";
import { useMutualFollowCount } from "@/hooks/useMutualFollowCount";

// 컴포넌트 import
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileTabs from "../../components/profile/ProfileTabs";
import PostGrid from "../../components/profile/PostGrid";
import MutualFollowListModal from "../../components/modal/followModal/MutualFollowListModal";

export default function UserProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const { profile, isLoading, error } = useUserProfile(username);
  const [activeTab, setActiveTab] = useState("posts");
  const [openMutualFollowModal, setOpenMutualFollowModal] = useState(false);

  // 맞팔로우 수 조회
  const { count: mutualFollowCount } = useMutualFollowCount(
    profile?.id || null
  );

  // 로딩 중이면 로딩 UI 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 접근 제한 확인 - ProfileHeader는 보이되 게시물은 숨김
  if (profile?.accessDenied) {
    return (
      <>
        {/* 프로필 헤더는 보임 */}
        <ProfileHeader profile={profile} />

        {/* 비공개 프로필 메시지 */}
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              비공개 프로필
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {profile.message ||
                "이 사용자의 프로필은 비공개로 설정되어 있습니다."}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      </>
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
      <ProfileHeader
        profile={profile}
        mutualFollowCount={mutualFollowCount}
        onMutualFollowClick={() => setOpenMutualFollowModal(true)}
      />

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

      {/* 맞팔로우 모달 */}
      <MutualFollowListModal
        open={openMutualFollowModal}
        onClose={() => setOpenMutualFollowModal(false)}
        userId={profile.id}
        username={profile.username}
      />
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
