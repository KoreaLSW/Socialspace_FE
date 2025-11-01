"use client";

import { useRecommendedUsers } from "@/hooks/useRecommendedUsers";
import { Trend } from "@/types/post";
import { useRouter } from "next/navigation";
import UserList from "../follow/UserList";
import { postsApi } from "@/lib/api/posts";
import useSWR from "swr";

export default function RightSidebar() {
  const { recommendedUsers, isLoading } = useRecommendedUsers(5);
  const router = useRouter();

  // 인기 해시태그 조회 (게시물 수 기준 상위 5개)
  const { data: popularHashtags, isLoading: isLoadingTrends } = useSWR(
    "popular-hashtags",
    () => postsApi.getPopularHashtags(5),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분
    }
  );

  const trends: Trend[] = popularHashtags
    ? popularHashtags.map((h) => ({
        hashtag: `#${h.name}`,
        postCount: h.post_count.toLocaleString(),
      }))
    : [];

  return (
    <div className="fixed right-0 top-0 h-full w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 hidden lg:block overflow-y-auto scrollbar-gutter-stable">
      {/* 추천 사용자 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          팔로우 추천
        </h3>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-400">로딩 중...</div>
          ) : recommendedUsers.length === 0 ? (
            <div className="text-center text-gray-400">
              추천 사용자가 없습니다.
            </div>
          ) : (
            <UserList users={recommendedUsers} avatarSize="w-8 h-8" />
          )}
        </div>
        {/* 더보기 버튼 */}
        <div className="mt-4 text-center">
          <button
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={() => router.push("/recommended-users")}
          >
            더보기
          </button>
        </div>
      </div>

      {/* 트렌드 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          지금 인기
        </h3>
        <div className="space-y-3">
          {isLoadingTrends ? (
            <div className="text-center text-gray-400">로딩 중...</div>
          ) : trends.length === 0 ? (
            <div className="text-center text-gray-400">
              인기 해시태그가 없습니다.
            </div>
          ) : (
            trends.map((trend, index) => (
              <button
                key={index}
                onClick={() => {
                  const cleanTag = trend.hashtag.replace(/^#/, "");
                  router.push(`/tag/${encodeURIComponent(cleanTag)}`);
                }}
                className="w-full text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
              >
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  {trend.hashtag}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {trend.postCount}개의 게시물
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
