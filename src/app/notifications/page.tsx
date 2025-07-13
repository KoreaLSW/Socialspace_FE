"use client";

import { Bell, Heart, MessageCircle, UserPlus, Share } from "lucide-react";

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: "like",
      username: "jane_doe",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b867?w=40&h=40&fit=crop&crop=face",
      message: "님이 회원님의 게시물을 좋아합니다.",
      time: "5분 전",
      isNew: true,
    },
    {
      id: 2,
      type: "comment",
      username: "tech_lover",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      message:
        '님이 회원님의 게시물에 댓글을 남겼습니다: "정말 유용한 정보네요!"',
      time: "1시간 전",
      isNew: true,
    },
    {
      id: 3,
      type: "follow",
      username: "design_tips",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      message: "님이 회원님을 팔로우하기 시작했습니다.",
      time: "2시간 전",
      isNew: false,
    },
    {
      id: 4,
      type: "share",
      username: "dev_community",
      avatar:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face",
      message: "님이 회원님의 게시물을 공유했습니다.",
      time: "1일 전",
      isNew: false,
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="text-red-500" size={20} />;
      case "comment":
        return <MessageCircle className="text-blue-500" size={20} />;
      case "follow":
        return <UserPlus className="text-green-500" size={20} />;
      case "share":
        return <Share className="text-purple-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  return (
    <>
      {/* 알림 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            알림
          </h1>
          <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            모두 읽음
          </button>
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500 dark:text-gray-400">
              새로운 알림이 없습니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                  notification.isNew ? "bg-blue-50 dark:bg-blue-900/10" : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={notification.avatar}
                    alt={notification.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white">
                          <span className="font-medium">
                            {notification.username}
                          </span>
                          {notification.message}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.type)}
                        {notification.isNew && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
