"use client";

import { Search as SearchIcon, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const trendingTopics = [
    "#개발",
    "#디자인",
    "#기술",
    "#프로그래밍",
    "#UI/UX",
    "#웹개발",
    "#모바일앱",
    "#스타트업",
  ];

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
            placeholder="사용자, 해시태그, 게시물 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-full outline-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 트렌딩 토픽 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="text-orange-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            트렌딩 토픽
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {trendingTopics.map((topic, index) => (
            <button
              key={index}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <p className="font-medium text-gray-900 dark:text-white">
                {topic}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {Math.floor(Math.random() * 50 + 10)}k 게시물
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
