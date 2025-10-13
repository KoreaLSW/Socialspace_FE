"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageCircle, Bell, PlusSquare } from "lucide-react";

export default function MobileNavigation() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "홈", href: "/" },
    { icon: Search, label: "검색", href: "/search" },
    { icon: MessageCircle, label: "메세지", href: "/messages" },
    { icon: Bell, label: "알림", href: "/notifications" },
    { icon: PlusSquare, label: "글쓰기", href: "/create" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden w-full max-w-full overflow-hidden">
      <div className="flex justify-around py-2 w-full">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link key={index} href={item.href} className="flex-1 min-w-0">
              <button
                className={`w-full p-2 sm:p-3 flex items-center justify-center ${
                  isActive ? "text-blue-500" : "text-gray-500"
                }`}
              >
                <item.icon size={20} className="sm:w-6 sm:h-6" />
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
