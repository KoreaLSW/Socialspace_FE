"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Mail, Eye, EyeOff, User, Check, AlertTriangle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

// 모바일 In-App 브라우저 감지 함수
const detectInAppBrowser = () => {
  if (typeof window === "undefined") return null;

  const ua = navigator.userAgent || navigator.vendor || "";

  // Instagram
  if (ua.indexOf("Instagram") > -1) {
    return {
      name: "Instagram",
      instruction:
        "우측 상단 '...' 메뉴 → 'Safari에서 열기' 또는 'Chrome에서 열기'를 선택해주세요.",
    };
  }

  // Facebook
  if (ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1) {
    return {
      name: "Facebook",
      instruction:
        "우측 상단 '...' 메뉴 → 'Safari에서 열기' 또는 'Chrome에서 열기'를 선택해주세요.",
    };
  }

  // KakaoTalk
  if (ua.indexOf("KAKAOTALK") > -1) {
    return {
      name: "카카오톡",
      instruction:
        "우측 상단 '...' 메뉴 → '다른 브라우저로 열기'를 선택해주세요.",
    };
  }

  // Line
  if (ua.indexOf("Line") > -1) {
    return {
      name: "Line",
      instruction:
        "우측 상단 메뉴 → 'Safari에서 열기' 또는 'Chrome에서 열기'를 선택해주세요.",
    };
  }

  // Naver
  if (ua.indexOf("NAVER") > -1) {
    return {
      name: "네이버",
      instruction: "우측 상단 메뉴 → '다른 브라우저로 열기'를 선택해주세요.",
    };
  }

  // WeChat
  if (ua.indexOf("MicroMessenger") > -1) {
    return {
      name: "WeChat",
      instruction: "우측 상단 메뉴 → 'Open in Safari'를 선택해주세요.",
    };
  }

  // Twitter/X
  if (ua.indexOf("Twitter") > -1) {
    return {
      name: "Twitter",
      instruction:
        "우측 상단 메뉴 → 'Safari에서 열기' 또는 'Chrome에서 열기'를 선택해주세요.",
    };
  }

  // 일반 WebView (iOS)
  if (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua)) {
    return {
      name: "앱 내장 브라우저",
      instruction: "Safari 또는 Chrome 앱에서 직접 접속해주세요.",
    };
  }

  // 일반 WebView (Android)
  if (/Android.*wv\)|Version\/[\d.]+.*Chrome\/[.0-9]*/.test(ua)) {
    return {
      name: "앱 내장 브라우저",
      instruction: "Chrome 앱에서 직접 접속해주세요.",
    };
  }

  return null;
};

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState<{
    name: string;
    instruction: string;
  } | null>(null);
  const [showWarning, setShowWarning] = useState(true);
  const router = useRouter();

  // 컴포넌트 마운트 시 In-App 브라우저 감지
  useEffect(() => {
    const browser = detectInAppBrowser();
    if (browser) {
      setInAppBrowser(browser);
      console.warn("⚠️ In-App 브라우저 감지됨:", browser.name);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleSignup = async () => {
    // In-App 브라우저 체크
    if (inAppBrowser) {
      alert(
        `⚠️ ${inAppBrowser.name}에서는 Google 로그인이 지원되지 않습니다.\n\n` +
          `Google의 보안 정책으로 인해 앱 내장 브라우저에서는 로그인이 차단됩니다.\n\n` +
          `${inAppBrowser.instruction}`
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log("🚀 구글 회원가입 시작...");

      // NextAuth를 사용하여 구글 로그인 시작 (자동 리디렉션 활성화)
      const result = await signIn("google", {
        callbackUrl: "/",
        redirect: true, // 자동 리디렉션 활성화
      });

      console.log("🔍 signIn 결과:", result);
    } catch (error) {
      console.error("❌ Google 회원가입 오류:", error);
      alert("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      alert("이용약관에 동의해주세요.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    // 회원가입 로직
    alert("회원가입이 완료되었습니다!");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      {/* In-App 브라우저 경고 배너 */}
      {inAppBrowser && showWarning && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-500" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                ⚠️ {inAppBrowser.name} 앱 내 브라우저 감지됨
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p className="mb-2">
                  Google의 보안 정책으로 인해 앱 내장 브라우저에서는 Google
                  로그인이 차단됩니다.
                </p>
                <p className="font-semibold mb-2">해결 방법:</p>
                <p className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded border border-yellow-200 dark:border-yellow-700">
                  {inAppBrowser.instruction}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="ml-3 flex-shrink-0 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
            >
              <span className="sr-only">닫기</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="text-center mb-8">
        <Link href="/">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 cursor-pointer">
            SocialSpace
          </h1>
        </Link>
        <p className="text-gray-600 dark:text-gray-400">
          새로운 소셜 경험을 시작하세요
        </p>
      </div>

      {/* 구글 회원가입 버튼 */}
      <button
        onClick={handleGoogleSignup}
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {isLoading ? "가입 중..." : "Google 계정으로 가입하기"}
        </span>
      </button>

      {/* 구분선 */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            또는 이메일로 가입
          </span>
        </div>
      </div>

      {/* 회원가입 폼 */}
      <form onSubmit={handleSignup} className="space-y-4">
        {/* 사용자명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            사용자명
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="사용자명을 입력하세요"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            이메일
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="이메일을 입력하세요"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>

        {/* 이용약관 동의 */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setAcceptTerms(!acceptTerms)}
            className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
              acceptTerms
                ? "bg-blue-500 border-blue-500 text-white"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {acceptTerms && <Check size={14} />}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <Link href="/terms" className="text-blue-500 hover:underline">
              이용약관
            </Link>{" "}
            및{" "}
            <Link href="/privacy" className="text-blue-500 hover:underline">
              개인정보처리방침
            </Link>
            에 동의합니다
          </span>
        </div>

        {/* 회원가입 버튼 */}
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          회원가입
        </button>
      </form>

      {/* 로그인 링크 */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/auth/login"
            className="text-blue-500 hover:underline font-medium"
          >
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
}
