"use client";

import { UnreadBadgeProps } from "@/types/chat";

export default function UnreadBadge({
  count,
  maxDisplay = 99,
  size = "md",
  variant = "primary",
}: UnreadBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > maxDisplay ? `${maxDisplay}+` : count.toString();

  const sizeClasses = {
    sm: "h-4 w-4 text-xs min-w-[16px]",
    md: "h-5 w-5 text-xs min-w-[20px]",
    lg: "h-6 w-6 text-sm min-w-[24px]",
  };

  const variantClasses = {
    primary: "bg-blue-500 text-white",
    secondary: "bg-red-500 text-white",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full flex items-center justify-center font-medium
        animate-pulse
      `}
      title={`${count}개의 읽지 않은 메시지`}
    >
      {displayCount}
    </div>
  );
}
