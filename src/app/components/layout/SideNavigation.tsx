"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import UserAvatar from "../common/UserAvatar";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import UserNickName from "../common/UserNickName";
import {
  Home,
  Search,
  MessageCircle,
  Bell,
  User,
  Settings,
  LogOut,
  Plus,
  LogIn,
  UserPlus,
  Menu,
  X,
} from "lucide-react";

export default function SideNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { logout, isLoggingOut } = useLogout();
  //const { count } = useUnreadNotifications();
  const { count } = useUnreadNotifications(isAuthenticated ? true : false);

  const handleLogout = async () => {
    await logout();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    {
      name: "홈",
      href: "/",
      icon: Home,
      current: pathname === "/",
    },
    {
      name: "검색",
      href: "/search",
      icon: Search,
      current: pathname === "/search",
    },
    {
      name: "메시지",
      href: "/messages",
      icon: MessageCircle,
      current: pathname === "/messages",
    },
    {
      name: "알림",
      href: "/notifications",
      icon: Bell,
      current: pathname === "/notifications",
    },
    {
      name: "프로필",
      href:
        isAuthenticated && user?.username
          ? `/profile/${user.username}`
          : "/auth/login",
      icon: User,
      current: pathname.startsWith("/profile"),
    },
    {
      name: "설정",
      href: "/settings",
      icon: Settings,
      current: pathname === "/settings",
    },
  ];

  if (isLoading) {
    return (
      <>
        {/* 모바일 햄버거 버튼 */}
        <button className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="animate-pulse">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </button>

        {/* 데스크톱 사이드바 */}
        <nav className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex-col fixed left-0 top-0 overflow-y-auto scrollbar-gutter-stable">
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-300 dark:bg-gray-600 rounded"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Menu size={24} className="text-gray-700 dark:text-gray-300" />
      </button>

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* 모바일 메뉴 */}
      <nav
        className={`md:hidden fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">
          {/* 모바일 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Social Space
            </h1>
            <button
              onClick={closeMobileMenu}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* 사용자 정보 (로그인 상태) */}
          {isAuthenticated && (
            <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <UserAvatar
                src={user?.profileImage as any}
                alt={user?.nickname || "사용자"}
                nameForInitial={user?.nickname || user?.username}
                size={40}
              />
              <div className="flex-1 min-w-0">
                <UserNickName
                  username={user?.username}
                  name={user?.nickname || user?.username}
                  className="font-medium text-gray-900 dark:text-white truncate"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{user?.username}
                </p>
              </div>
            </div>
          )}

          {/* 네비게이션 메뉴 */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.current
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* 게시하기 버튼 (로그인 상태에서만) */}
          {isAuthenticated && (
            <Link
              href="/create"
              onClick={closeMobileMenu}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium mt-6 flex items-center justify-center space-x-2 transition-colors"
            >
              <Plus size={20} />
              <span>게시하기</span>
            </Link>
          )}
        </div>

        {/* 하단 인증 섹션 */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
          {isAuthenticated ? (
            /* 로그아웃 버튼 (로그인 상태) */
            <button
              onClick={() => {
                handleLogout();
                closeMobileMenu();
              }}
              disabled={isLoggingOut}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={20} />
              <span>{isLoggingOut ? "로그아웃 중..." : "로그아웃"}</span>
            </button>
          ) : (
            /* 로그인/회원가입 버튼 (로그아웃 상태) */
            <div className="space-y-3">
              <Link
                href="/auth/login"
                onClick={closeMobileMenu}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <LogIn size={20} />
                <span>로그인</span>
              </Link>
              <Link
                href="/auth/signup"
                onClick={closeMobileMenu}
                className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <UserPlus size={20} />
                <span>회원가입</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* 데스크톱 사이드바 */}
      <nav className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex-col fixed left-0 top-0 overflow-y-auto scrollbar-gutter-stable">
        <div className="p-4">
          {/* 로고 */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Social Space
          </h1>

          {/* 사용자 정보 (로그인 상태) */}
          {isAuthenticated && (
            <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <UserAvatar
                src={user?.profileImage as any}
                alt={user?.nickname || "사용자"}
                nameForInitial={user?.nickname || user?.username}
                size={40}
                profileUsername={user?.username}
              />
              <div className="flex-1 min-w-0">
                <UserNickName
                  username={user?.username}
                  name={user?.nickname || user?.username}
                  className="font-medium text-gray-900 dark:text-white truncate"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{user?.username}
                </p>
              </div>
            </div>
          )}

          {/* 네비게이션 메뉴 */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.current
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="relative">
                    <Icon size={20} />
                    {item.name === "알림" && count > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </div>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* 게시하기 버튼 (로그인 상태에서만) */}
          {isAuthenticated && (
            <Link
              href="/create"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium mt-6 flex items-center justify-center space-x-2 transition-colors"
            >
              <Plus size={20} />
              <span>게시하기</span>
            </Link>
          )}
        </div>

        {/* 하단 인증 섹션 */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
          {isAuthenticated ? (
            /* 로그아웃 버튼 (로그인 상태) */
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={20} />
              <span>{isLoggingOut ? "로그아웃 중..." : "로그아웃"}</span>
            </button>
          ) : (
            /* 로그인/회원가입 버튼 (로그아웃 상태) */
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <LogIn size={20} />
                <span>로그인</span>
              </Link>
              <Link
                href="/auth/signup"
                className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <UserPlus size={20} />
                <span>회원가입</span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
