"use client";

import { User, Heart, MessageCircle as Comment, Share } from "lucide-react";
import { posts } from "@/lib/data";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();

  const user = session?.user;
  const isLoading = status === "loading";

  return (
    <>
      {/* 로그인 상태 확인 */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
        </div>
      )}

      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={user.profileImage || user.image || "/default-avatar.png"}
              alt={user.nickname || user.name || "사용자"}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.nickname || user.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>사용자 ID: {user.id}</p>
            <p>권한: {user.role}</p>
            <p>이메일 인증: {user.emailVerified ? "완료" : "미완료"}</p>
          </div>
        </div>
      )}

      {/* 포스트 작성 영역 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            {user?.profileImage || user?.image ? (
              <img
                src={user.profileImage || user.image}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="text-white" size={20} />
            )}
          </div>
          <input
            type="text"
            placeholder={
              user
                ? "무슨 일이 일어나고 있나요?"
                : "로그인 후 게시글을 작성하세요"
            }
            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 outline-none text-gray-900 dark:text-white placeholder-gray-500"
            disabled={!user}
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!user}
          >
            게시
          </button>
        </div>
      </div>

      {/* 포스트 목록 */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* 포스트 헤더 */}
            <div className="p-4 flex items-center space-x-3">
              <img
                src={post.avatar}
                alt={post.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {post.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {post.time}
                </p>
              </div>
            </div>

            {/* 포스트 내용 */}
            <div className="px-4 pb-3">
              <p className="text-gray-900 dark:text-white">{post.content}</p>
            </div>

            {/* 포스트 이미지 */}
            {post.image && (
              <div className="px-4 pb-3">
                <img
                  src={post.image}
                  alt="Post image"
                  className="w-full rounded-lg object-cover max-h-96"
                />
              </div>
            )}

            {/* 포스트 액션 */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
                    <Heart size={20} />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                    <Comment size={20} />
                    <span>{post.comments}</span>
                  </button>
                  <button className="text-gray-500 hover:text-green-500 transition-colors">
                    <Share size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
