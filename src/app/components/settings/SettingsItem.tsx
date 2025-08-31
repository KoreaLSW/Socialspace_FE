import { ChevronRight } from "lucide-react";
import { SettingsItem as SettingsItemType } from "../../../types/settings";

interface SettingsItemProps extends SettingsItemType {
  followRequestsCount?: number; // 팔로우 요청 건수 추가
}

export default function SettingsItem({
  label,
  description,
  onClick,
  followRequestsCount,
}: SettingsItemProps) {
  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center">
          <h3 className="font-medium text-gray-900 dark:text-white">{label}</h3>
          {/* 팔로우 요청 관리에 건수 배지 표시 (0일 때는 숨김, 빨간색으로 강조) */}
          {label === "팔로우 요청 관리" &&
            followRequestsCount !== undefined &&
            followRequestsCount > 0 && (
              <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800">
                {followRequestsCount}
              </span>
            )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
