"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  MessageCircle,
  Bell,
  PlusSquare,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SideNavigation() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const navItems = [
    { icon: Home, label: "홈", href: "/" },
    { icon: Search, label: "검색", href: "/search" },
    { icon: MessageCircle, label: "메세지", href: "/messages" },
    { icon: Bell, label: "알림", href: "/notifications" },
    { icon: PlusSquare, label: "글쓰기", href: "/create" },
    { icon: User, label: "프로필", href: "/profile" },
    { icon: Settings, label: "설정", href: "/settings" },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 hidden lg:block">
      <div className="mb-8">
        <Link href="/">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer">
            SocialSpace
          </h1>
        </Link>
      </div>

      <nav className="space-y-2">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link key={index} href={item.href}>
              <button
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <item.icon size={24} />
                <span className="font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>

      {/* 인증 섹션 */}
      <div className="absolute bottom-6 left-6 right-6 space-y-3">
        {user ? (
          // 로그인 상태
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <img
                src={user.profileImage || "/default-avatar.png"}
                alt={user.nickname || user.username || "사용자"}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {user.nickname || user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  // Express 서버 로그아웃 요청
                  const result = await logout();

                  if (result.success) {
                    // 홈으로 리다이렉트
                    window.location.href = "/";
                  } else {
                    console.error("로그아웃 실패:", result.error);
                    // 실패해도 홈으로 리다이렉트
                    window.location.href = "/";
                  }
                } catch (error) {
                  console.error("로그아웃 요청 중 오류:", error);
                  // 오류가 발생해도 홈으로 리다이렉트
                  window.location.href = "/";
                }
              }}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={18} />
              <span>{isLoading ? "로그아웃 중..." : "로그아웃"}</span>
            </button>
          </div>
        ) : (
          // 로그인 안된 상태
          <div className="space-y-3">
            <Link href="/auth/login">
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                로그인
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-3 px-4 rounded-lg transition-colors">
                회원가입
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
