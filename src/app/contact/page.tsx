"use client";

import Link from "next/link";
import { Mail, MessageCircle, Home } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* 헤더 */}
          <div className="mb-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 cursor-pointer">
                SocialSpace
              </h1>
            </Link>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              고객지원팀에 문의하기
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              문제가 있으시거나 도움이 필요하시면 언제든지 연락해주세요.
            </p>
          </div>

          {/* 연락처 정보 */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400">
              <Mail className="h-5 w-5" />
              <span>support@socialspace.com</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400">
              <MessageCircle className="h-5 w-5" />
              <span>문의사항이 있으시면 이메일로 연락해주세요</span>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            {/* 홈으로 돌아가기 */}
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <Home size={18} />
              <span>홈으로 돌아가기</span>
            </Link>

            {/* 로그인 페이지 */}
            <Link
              href="/auth/login"
              className="w-full inline-flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <span>다시 로그인하기</span>
            </Link>
          </div>

          {/* 도움말 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              일반적인 문제는{" "}
              <Link
                href="/auth/error"
                className="text-blue-500 hover:underline font-medium"
              >
                에러 페이지
              </Link>
              에서 해결할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
