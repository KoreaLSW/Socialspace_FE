"use client";

import { useState } from "react";
import { X, Users, Check, X as XIcon } from "lucide-react";
import { useCurrentUser } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useAuth";

interface MutualFollowModalProps {
  open: boolean;
  onClose: () => void;
}

export default function MutualFollowModal({
  open,
  onClose,
}: MutualFollowModalProps) {
  const { user } = useCurrentUser();
  const { updateProfile, isUpdating } = useUpdateProfile();
  const [showMutualFollow, setShowMutualFollow] = useState(
    user?.showMutualFollow ?? true
  );

  const handleSave = async () => {
    try {
      await updateProfile({ showMutualFollow });
      onClose();
    } catch (error) {
      console.error("맞팔로우 표시 설정 저장 실패:", error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Users className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              맞팔로우 표시
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            맞팔로우 관계를 UI에 표시할지 여부를 설정할 수 있습니다.
          </p>

          {/* 설정 옵션 */}
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showMutualFollow}
                onChange={(e) => setShowMutualFollow(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-900 dark:text-white">
                맞팔로우 관계 표시
              </span>
            </label>

            {/* 설명 */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {showMutualFollow ? "표시" : "숨김"} 모드
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {showMutualFollow
                  ? "프로필, 팔로워/팔로잉 목록에서 맞팔로우 관계를 표시합니다."
                  : "맞팔로우 관계를 UI에 표시하지 않습니다."}
              </p>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
