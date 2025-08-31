"use client";

import { useState, useEffect } from "react";
import { useCurrentUser, useUpdateProfile } from "@/hooks/useAuth";
import { Eye, EyeOff, Users } from "lucide-react";

interface EditVisibilityModalProps {
  open: boolean;
  onClose: () => void;
}

type VisibilityOption = "public" | "followers" | "private";

interface VisibilityOptionData {
  value: VisibilityOption;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const visibilityOptions: VisibilityOptionData[] = [
  {
    value: "public",
    label: "전체공개",
    description: "모든 사용자가 내 프로필을 볼 수 있습니다",
    icon: <Eye className="w-5 h-5 text-green-600" />,
  },
  {
    value: "followers",
    label: "팔로우만 공개",
    description: "팔로우한 사용자만 내 프로필을 볼 수 있습니다",
    icon: <Users className="w-5 h-5 text-blue-600" />,
  },
  {
    value: "private",
    label: "비공개",
    description: "아무도 내 프로필을 볼 수 없습니다",
    icon: <EyeOff className="w-5 h-5 text-gray-600" />,
  },
];

export default function EditVisibilityModal({
  open,
  onClose,
}: EditVisibilityModalProps) {
  const { user } = useCurrentUser();
  const { updateProfile, isUpdating } = useUpdateProfile();

  const [selectedVisibility, setSelectedVisibility] =
    useState<VisibilityOption>("public");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });

  // 모달이 열릴 때 현재 사용자의 visibility 설정을 가져옴
  useEffect(() => {
    if (open && user?.visibility) {
      setSelectedVisibility(user.visibility as VisibilityOption);
    }
  }, [open, user?.visibility]);

  const handleSave = async () => {
    try {
      const result = await updateProfile({ visibility: selectedVisibility });

      if ((result as any)?.success === false) {
        setToast({
          visible: true,
          message: "프로필 공개 범위 업데이트에 실패했습니다.",
          type: "error",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1500);
        return;
      }

      setToast({
        visible: true,
        message: "프로필 공개 범위가 변경되었습니다.",
        type: "success",
      });
      setTimeout(() => {
        setToast((t) => ({ ...t, visible: false }));
        onClose();
      }, 1000);
    } catch (e) {
      setToast({
        visible: true,
        message: "오류가 발생했습니다. 잠시 후 다시 시도하세요.",
        type: "error",
      });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1500);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          프로필 공개 범위 설정
        </h3>

        <div className="space-y-3 mb-6">
          {visibilityOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedVisibility === option.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={selectedVisibility === option.value}
                onChange={(e) =>
                  setSelectedVisibility(e.target.value as VisibilityOption)
                }
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-start space-x-2 flex-1">
                {option.icon}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {option.description}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            disabled={isUpdating}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdating}
            className={`rounded-md px-4 py-2 text-white ${
              isUpdating
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isUpdating ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>저장 중...</span>
              </div>
            ) : (
              "저장"
            )}
          </button>
        </div>

        {toast.visible && (
          <div
            className={`fixed right-4 top-4 z-[60] rounded-md px-4 py-2 text-sm shadow-lg ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
