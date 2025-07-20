"use client";

import { getSuggestedUsers, getTrends } from "@/lib/data";

export default function RightSidebar() {
  const suggestedUsers = getSuggestedUsers();
  const trends = getTrends();

  return (
    <div className="fixed right-0 top-0 h-full w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 hidden lg:block overflow-y-auto scrollbar-gutter-stable">
      {/* 추천 사용자 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          팔로우 추천
        </h3>
        <div className="space-y-3">
          {suggestedUsers.map((user, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.followers} 팔로워
                  </p>
                </div>
              </div>
              <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                팔로우
              </button>
            </div>
          ))}
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
