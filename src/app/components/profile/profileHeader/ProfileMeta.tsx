import React, { memo } from "react";
import { Calendar } from "lucide-react";

function ProfileMeta({
  createdAt,
  className,
}: {
  createdAt?: string | Date;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="flex items-center space-x-1">
        <Calendar size={16} />
        <span>
          {createdAt
            ? new Date(createdAt as any).getFullYear() + "년에 가입"
            : "가입일 정보 없음"}
        </span>
      </div>
    </div>
  );
}

export default memo(ProfileMeta);
