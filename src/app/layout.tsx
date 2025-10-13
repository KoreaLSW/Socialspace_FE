import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SideNavigation from "./components/layout/SideNavigation";
import RightSidebar from "./components/layout/RightSidebar";
import MobileNavigation from "./components/layout/MobileNavigation";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SocialSpace - SNS 커뮤니티",
  description: "인스타그램과 레딧 스타일의 소셜 네트워크 서비스",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full overflow-x-hidden">
            <div className="flex w-full max-w-none lg:max-w-[1400px] lg:mx-auto">
              {/* 왼쪽 사이드바 - 고정 네비게이션 */}
              <SideNavigation />

              {/* 중앙 콘텐츠 영역 */}
              <div className="flex-1 w-full lg:ml-64 lg:mr-72 px-3 sm:px-4 py-6 pb-20 lg:pb-6 min-w-0">
                <div className="w-full max-w-full overflow-hidden">
                  {children}
                </div>
              </div>

              {/* 오른쪽 사이드바 - 추천 및 트렌드 */}
              <RightSidebar />

              {/* 모바일 하단 네비게이션 */}
              <MobileNavigation />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
