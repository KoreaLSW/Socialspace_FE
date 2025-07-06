"use client";

import { MessageCircle, Search } from "lucide-react";

export default function MessagesPage() {
  const conversations = [
    {
      id: 1,
      username: "jane_doe",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
      lastMessage: "안녕하세요! 프로젝트 관련해서 문의드리고 싶어요.",
      time: "2분 전",
      unread: true,
    },
    {
      id: 2,
      username: "tech_lover",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      lastMessage: "좋은 아이디어네요! 한번 시도해보겠습니다.",
      time: "1시간 전",
      unread: false,
    },
    {
      id: 3,
      username: "design_tips",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      lastMessage: "디자인 시안 확인 부탁드립니다.",
      time: "3시간 전",
      unread: true,
    },
  ];

  return (
    <>
      {/* 메세지 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            메세지
          </h1>
          <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Search size={20} />
          </button>
        </div>

        {/* 검색바 */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="대화 검색..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full outline-none text-gray-900 dark:text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* 대화 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500 dark:text-gray-400">
              아직 메세지가 없습니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={conversation.avatar}
                    alt={conversation.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {conversation.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {conversation.time}
                      </p>
                    </div>
                    <p
                      className={`text-sm truncate ${
                        conversation.unread
                          ? "text-gray-900 dark:text-white font-medium"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unread && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
