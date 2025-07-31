"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // 에러 타입별 메시지 정의
  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case "Configuration":
        return {
          title: "서버 설정 오류",
          message: "인증 서버에 일시적인 문제가 발생했습니다.",
          suggestion: "잠시 후 다시 시도해주세요.",
        };
      case "AccessDenied":
        return {
          title: "접근 거부",
          message: "로그인 권한이 거부되었습니다.",
          suggestion: "다른 계정으로 시도하거나 관리자에게 문의하세요.",
        };
      case "Verification":
        return {
          title: "인증 실패",
          message: "이메일 인증에 실패했습니다.",
          suggestion: "올바른 인증 링크를 클릭했는지 확인해주세요.",
        };
      case "Default":
      default:
        return {
          title: "로그인 실패",
          message: "로그인 중 문제가 발생했습니다.",
          suggestion: "다시 시도하거나 다른 방법으로 로그인해주세요.",
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* 에러 아이콘 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          {/* 헤더 */}
          <div className="mb-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 cursor-pointer">
                SocialSpace
              </h1>
            </Link>
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              {errorInfo.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {errorInfo.message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {errorInfo.suggestion}
            </p>
          </div>

          {/* 에러 세부정보 (개발 모드에서만) */}
          {process.env.NODE_ENV === "development" && error && (
            <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>에러 코드:</strong> {error}
              </p>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            {/* 다시 로그인 시도 */}
            <Link
              href="/auth/login"
              className="w-full inline-flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <RotateCcw size={18} />
              <span>다시 로그인하기</span>
            </Link>

            {/* 회원가입 */}
            <Link
              href="/auth/signup"
              className="w-full inline-flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <span>회원가입하기</span>
            </Link>

            {/* 홈으로 돌아가기 */}
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium py-2 transition-colors"
            >
              <Home size={18} />
              <span>홈으로 돌아가기</span>
            </Link>
          </div>

          {/* 도움말 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              문제가 계속 발생하나요?{" "}
              <Link
                href="/contact"
                className="text-blue-500 hover:underline font-medium"
              >
                고객지원팀에 문의하세요
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
