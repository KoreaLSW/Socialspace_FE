"use client";

import { ChevronDown, Clock, TrendingUp, Users, Zap } from "lucide-react";
import { useState } from "react";
import { SortOption } from "@/lib/postSorter";

interface PostSortSelectorProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions = [
  {
    value: "latest" as SortOption,
    label: "최신순",
    icon: Clock,
    description: "가장 최근에 작성된 게시글부터",
  },
  {
    value: "popular" as SortOption,
    label: "인기순",
    icon: TrendingUp,
    description: "좋아요와 댓글이 많은 게시글부터",
  },
  {
    value: "trending" as SortOption,
    label: "트렌딩",
    icon: Zap,
    description: "최근 24시간 내 인기 상승 게시글",
  },
  {
    value: "following" as SortOption,
    label: "팔로잉",
    icon: Users,
    description: "팔로우한 사용자의 게시글 우선",
  },
];

export default function PostSortSelector({
  currentSort,
  onSortChange,
}: PostSortSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = sortOptions.find(
    (option) => option.value === currentSort
  );

  return (
    <div className="relative mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full sm:w-auto min-w-[180px] px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center space-x-2">
          {currentOption && (
            <currentOption.icon
              size={16}
              className="text-gray-600 dark:text-gray-400"
            />
          )}
          <span className="font-medium text-gray-900 dark:text-white">
            {currentOption?.label || "정렬 선택"}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-80 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSortChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-start space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                currentSort === option.value
                  ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                  : ""
              }`}
            >
              <option.icon
                size={18}
                className={`mt-0.5 ${
                  currentSort === option.value
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              />
              <div>
                <div
                  className={`font-medium ${
                    currentSort === option.value
                      ? "text-blue-900 dark:text-blue-200"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {option.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 클릭 외부 영역 감지 */}
      {isOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
