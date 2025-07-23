"use client";

import { useRecommendedUsers } from "@/hooks/useRecommendedUsers";
import { Trend } from "@/types/post";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import UserList from "../common/UserList";

// 임시 트렌드 더미 데이터
const dummyTrends: Trend[] = [
  { hashtag: "#NextJS", postCount: "1,234" },
  { hashtag: "#React", postCount: "987" },
  { hashtag: "#TypeScript", postCount: "654" },
];

export default function RightSidebar() {
  const { recommendedUsers, isLoading } = useRecommendedUsers(5);
  const trends = useMemo(() => dummyTrends, []);
  const router = useRouter();

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
          {trends.map((trend, index) => (
            <div key={index} className="text-sm">
              <p className="text-gray-500 dark:text-gray-400">
                {trend.hashtag}
              </p>
              <p className="text-gray-900 dark:text-white font-medium">
                {trend.postCount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
