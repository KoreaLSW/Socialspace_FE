"use client";

import { useState, useEffect } from "react";
import { useChatSettings } from "@/hooks/useChat";

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  otherMemberNickname: string;
}

export default function ChatSettingsModal({
  isOpen,
  onClose,
  roomId,
  otherMemberNickname,
}: ChatSettingsModalProps) {
  const { settings, isLoading, updateSettings } = useChatSettings();
  const [isMuted, setIsMuted] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);

  useEffect(() => {
    if (settings) {
      setIsMuted(settings.is_muted || false);
      setAutoDownload(settings.auto_download_media !== false);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        is_muted: isMuted,
        auto_download_media: autoDownload,
      });
      alert("설정이 저장되었습니다.");
      onClose();
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("설정 저장에 실패했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              채팅 설정
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-6 py-4 space-y-6">
          {/* 채팅방 정보 */}
          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              채팅방 정보
            </h3>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {otherMemberNickname}
            </p>
          </div>

          {/* 알림 설정 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                알림 끄기
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                이 채팅방의 알림을 받지 않습니다
              </p>
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isMuted ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isMuted ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 미디어 자동 다운로드 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                미디어 자동 다운로드
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                이미지와 파일을 자동으로 다운로드합니다
              </p>
            </div>
            <button
              onClick={() => setAutoDownload(!autoDownload)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoDownload ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoDownload ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 위험 구역 */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
              위험 구역
            </h3>
            <button
              className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              onClick={() => {
                if (
                  confirm(
                    `${otherMemberNickname}님과의 채팅방을 나가시겠습니까?\n모든 메시지가 삭제됩니다.`
                  )
                ) {
                  // TODO: 채팅방 나가기 처리
                  alert("채팅방 나가기 기능은 곧 추가될 예정입니다.");
                }
              }}
            >
              채팅방 나가기
            </button>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}




