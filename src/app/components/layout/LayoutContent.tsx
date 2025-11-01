"use client";

import { useRef } from "react";
import SideNavigation, { SideNavigationRef } from "./SideNavigation";
import RightSidebar from "./RightSidebar";
import MobileNavigation from "./MobileNavigation";
import MobileTopHeader from "./MobileTopHeader";

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const sideNavRef = useRef<SideNavigationRef>(null);

  const handleMenuClick = () => {
    sideNavRef.current?.toggleMobileMenu();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full overflow-x-hidden">
      {/* 모바일 상단 헤더 */}
      <MobileTopHeader onMenuClick={handleMenuClick} />

      <div className="flex w-full max-w-none lg:max-w-[1400px] lg:mx-auto">
        {/* 왼쪽 사이드바 - 고정 네비게이션 */}
        <SideNavigation ref={sideNavRef} />

        {/* 중앙 콘텐츠 영역 */}
        <div className="flex-1 w-full lg:ml-64 lg:mr-72 px-3 sm:px-4 pt-16 lg:pt-6 py-6 pb-20 lg:pb-6 min-w-0">
          <div className="w-full max-w-full overflow-hidden">{children}</div>
        </div>

        {/* 오른쪽 사이드바 - 추천 및 트렌드 */}
        <RightSidebar />

        {/* 모바일 하단 네비게이션 */}
        <MobileNavigation />
      </div>
    </div>
  );
}













