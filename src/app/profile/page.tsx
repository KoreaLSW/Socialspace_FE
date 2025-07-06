"use client";

import { Settings, MapPin, Calendar, Link as LinkIcon } from "lucide-react";

export default function ProfilePage() {
  const userProfile = {
    username: "user123",
    displayName: "김개발자",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face",
    bio: "풀스택 개발자 | 새로운 기술을 배우는 것을 좋아합니다 ✨",
    location: "서울, 대한민국",
    website: "https://github.com/user123",
    joinDate: "2024년 1월",
    followers: 1248,
    following: 892,
    posts: 42,
  };

  return (
    <>
      {/* 프로필 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <img
              src={userProfile.avatar}
              alt={userProfile.username}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {userProfile.displayName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                @{userProfile.username}
              </p>
            </div>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Settings size={16} />
            <span className="text-gray-700 dark:text-gray-300">편집</span>
          </button>
        </div>

        {/* 프로필 정보 */}
        <div className="mb-4">
          <p className="text-gray-900 dark:text-white mb-3">
            {userProfile.bio}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <MapPin size={16} />
              <span>{userProfile.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <LinkIcon size={16} />
              <a
                href={userProfile.website}
                className="text-blue-500 hover:underline"
              >
                {userProfile.website}
              </a>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar size={16} />
              <span>{userProfile.joinDate}에 가입</span>
            </div>
          </div>
        </div>

        {/* 팔로워/팔로잉 통계 */}
        <div className="flex items-center space-x-6">
          <div>
            <span className="font-bold text-gray-900 dark:text-white">
              {userProfile.posts.toLocaleString()}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              게시물
            </span>
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white">
              {userProfile.followers.toLocaleString()}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              팔로워
            </span>
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white">
              {userProfile.following.toLocaleString()}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              팔로잉
            </span>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button className="flex-1 py-4 px-6 text-center border-b-2 border-blue-500 text-blue-500 font-medium">
            게시물
          </button>
          <button className="flex-1 py-4 px-6 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            미디어
          </button>
          <button className="flex-1 py-4 px-6 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            좋아요
          </button>
        </div>
      </div>

      {/* 게시물 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          아직 게시물이 없습니다.
        </p>
        <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          첫 번째 게시물 작성하기
        </button>
      </div>
    </>
  );
}
