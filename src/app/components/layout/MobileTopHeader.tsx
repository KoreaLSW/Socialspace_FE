"use client";

import Link from "next/link";
import { Bell, MessageCircle, Menu } from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useCurrentUser } from "@/hooks/useAuth";

interface MobileTopHeaderProps {
  onMenuClick?: () => void;
}

export default function MobileTopHeader({ onMenuClick }: MobileTopHeaderProps) {
  const { isAuthenticated } = useCurrentUser();
  const { count } = useUnreadNotifications(isAuthenticated ? true : false);

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 w-full">
      <div className="flex items-center justify-between px-4 py-3">
        {/* 왼쪽 햄버거 메뉴와 로고 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <Link href="/" className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Social Space
            </h1>
          </Link>
        </div>

        {/* 오른쪽 아이콘들 */}
        <div className="flex items-center space-x-4">
          {/* 알림 아이콘 */}
          <Link
            href="/notifications"
            className="relative text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <Bell size={24} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-medium">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {/* 메시지 아이콘 */}
          <Link
            href="/messages"
            className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <MessageCircle size={24} />
          </Link>
        </div>
      </div>
    </div>
  );
}
