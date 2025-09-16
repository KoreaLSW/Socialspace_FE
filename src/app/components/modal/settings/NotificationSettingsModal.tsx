"use client";

import { useState } from "react";
import { X, Bell, Heart, MessageSquare, UserPlus } from "lucide-react";
import {
  useNotificationPreferences,
  useNotificationPreferencesActions,
} from "@/hooks/useNotificationPreferences";
import { NotificationPreferences } from "@/lib/api/notificationPreferences";

interface NotificationSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({
  open,
  onClose,
}: NotificationSettingsModalProps) {
  const { preferences, isLoading: preferencesLoading } =
    useNotificationPreferences();
  const { togglePreference, isLoading: actionLoading } =
    useNotificationPreferencesActions();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  // 모달이 열릴 때마다 로컬 상태 동기화
  if (
    open &&
    preferences &&
    JSON.stringify(localPreferences) !== JSON.stringify(preferences)
  ) {
    setLocalPreferences(preferences);
  }

  if (!open) return null;

  const handleToggle = async (type: keyof NotificationPreferences) => {
    if (!preferences) return;

    try {
      // 로컬 상태 즉시 업데이트 (낙관적 업데이트)
      const newPreferences = {
        ...localPreferences!,
        [type]: !localPreferences![type],
      };
      setLocalPreferences(newPreferences);

      // 서버에 요청
      await togglePreference(type);
    } catch (error) {
      // 실패 시 롤백
      setLocalPreferences(preferences);
      console.error("알림 설정 토글 실패:", error);
    }
  };

  const notificationItems = [
    {
      key: "follow" as const,
      icon: UserPlus,
      label: "팔로우 알림",
      description: "누군가 나를 팔로우했을 때",
    },
    {
      key: "followee_post" as const,
      icon: Bell,
      label: "팔로잉 게시물 알림",
      description: "팔로우한 사람이 새 게시물을 올렸을 때",
    },
    {
      key: "post_liked" as const,
      icon: Heart,
      label: "게시물 좋아요 알림",
      description: "내 게시물에 좋아요를 받았을 때",
    },
    {
      key: "comment_liked" as const,
      icon: Heart,
      label: "댓글 좋아요 알림",
      description: "내 댓글에 좋아요를 받았을 때",
    },
    {
      key: "post_commented" as const,
      icon: MessageSquare,
      label: "게시물 댓글 알림",
      description: "내 게시물에 댓글이 달렸을 때",
    },
    {
      key: "mention_comment" as const,
      icon: Bell,
      label: "멘션 알림",
      description: "댓글에서 나를 멘션했을 때",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            알림 설정
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {preferencesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {notificationItems.map((item) => {
              const IconComponent = item.icon;
              const isEnabled = localPreferences?.[item.key] ?? false;

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(item.key)}
                    disabled={actionLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isEnabled ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
                    } ${actionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
