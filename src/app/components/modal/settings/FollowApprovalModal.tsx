"use client";

import { useState } from "react";
import { X, Settings, Check } from "lucide-react";
import { useUpdateProfile } from "@/hooks/useAuth";

interface FollowApprovalModalProps {
  open: boolean;
  onClose: () => void;
  currentMode?: string;
}

export default function FollowApprovalModal({
  open,
  onClose,
  currentMode = "auto",
}: FollowApprovalModalProps) {
  const [selectedMode, setSelectedMode] = useState<"auto" | "manual">(
    currentMode as "auto" | "manual"
  );
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const { updateProfile, isUpdating } = useUpdateProfile();

  const handleSave = async () => {
    try {
      await updateProfile({ followApprovalMode: selectedMode });
      setToast({
        visible: true,
        message: "팔로우 승인 방식이 변경되었습니다",
        type: "success",
      });
      setTimeout(() => {
        setToast((t) => ({ ...t, visible: false }));
        onClose();
      }, 2000);
    } catch (error) {
      setToast({
        visible: true,
        message: "설정 변경 중 오류가 발생했습니다",
        type: "error",
      });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              팔로우 승인 방식
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* 설명 */}
        <div className="p-6 pb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            다른 사용자가 회원님을 팔로우하려고 할 때의 승인 방식을 선택하세요.
          </p>

          {/* 옵션들 */}
          <div className="space-y-4">
            {/* 자동 승인 */}
            <div
              onClick={() => setSelectedMode("auto")}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedMode === "auto"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`mt-1 ${
                    selectedMode === "auto" ? "text-blue-500" : "text-gray-400"
                  }`}
                >
                  {selectedMode === "auto" ? (
                    <Check size={20} />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-current"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-medium ${
                      selectedMode === "auto"
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    자동 승인
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    팔로우 요청이 즉시 승인됩니다. 누구나 회원님을 바로 팔로우할
                    수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 수동 승인 */}
            <div
              onClick={() => setSelectedMode("manual")}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedMode === "manual"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`mt-1 ${
                    selectedMode === "manual"
                      ? "text-blue-500"
                      : "text-gray-400"
                  }`}
                >
                  {selectedMode === "manual" ? (
                    <Check size={20} />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-current"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-medium ${
                      selectedMode === "manual"
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    수동 승인
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    팔로우 요청을 직접 승인하거나 거절할 수 있습니다. 더 높은
                    프라이버시를 제공합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex items-center justify-end space-x-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating || selectedMode === currentMode}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "저장 중..." : "저장"}
          </button>
        </div>

        {/* Toast */}
        {toast.visible && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60]">
            <div
              className={`px-4 py-2 rounded-lg shadow-lg text-white text-sm ${
                toast.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
