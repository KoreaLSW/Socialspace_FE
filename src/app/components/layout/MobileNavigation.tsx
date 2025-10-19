"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, PlusSquare } from "lucide-react";
import { useCurrentUser } from "@/hooks/useAuth";
import UserAvatar from "../common/UserAvatar";

export default function MobileNavigation() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useCurrentUser();

  const navItems = [
    { icon: Home, label: "홈", href: "/", type: "icon" as const },
    { icon: Search, label: "검색", href: "/search", type: "icon" as const },
    {
      icon: PlusSquare,
      label: "글쓰기",
      href: "/create",
      type: "icon" as const,
    },
    {
      icon: Bell,
      label: "알림",
      href: "/notifications",
      type: "icon" as const,
    },
    {
      label: "프로필",
      href:
        isAuthenticated && user?.username
          ? `/profile/${user.username}`
          : "/auth/login",
      type: "avatar" as const,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden w-full max-w-full overflow-hidden">
      <div className="flex justify-around py-2 w-full">
        {navItems.map((item, index) => {
          const isActive =
            item.type === "avatar"
              ? pathname.startsWith("/profile") &&
                user?.username &&
                pathname.includes(user.username)
              : pathname === item.href;

          return (
            <Link key={index} href={item.href} className="flex-1 min-w-0">
              <button
                className={`w-full p-2 sm:p-3 flex items-center justify-center ${
                  isActive ? "text-blue-500" : "text-gray-500"
                }`}
              >
                {item.type === "avatar" ? (
                  <div
                    className={`${
                      isActive ? "ring-2 ring-blue-500" : ""
                    } rounded-full`}
                  >
                    <UserAvatar
                      src={user?.profileImage as any}
                      alt={user?.nickname || "프로필"}
                      nameForInitial={user?.nickname || user?.username}
                      size={24}
                    />
                  </div>
                ) : (
                  <item.icon size={20} className="sm:w-6 sm:h-6" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
