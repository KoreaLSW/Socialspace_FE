"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Mail, Eye, EyeOff, AlertTriangle, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { authApi } from "@/lib/api/auth";

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

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
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

  const handleGoogleLogin = async () => {
    console.log("🚀 [클라이언트] Google 로그인 버튼 클릭됨");
    console.log("🔍 [클라이언트] 현재 URL:", window.location.href);

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
      console.log("📞 [클라이언트] signIn 함수 호출 중...");

      // redirect: true일 때는 Google OAuth 페이지로 자동 리디렉션됨
      await signIn("google", {
        callbackUrl: "/",
        redirect: true,
      });

      // redirect: true일 때는 이 코드에 도달하지 않음 (Google로 리디렉션됨)
      console.log("🤔 [클라이언트] 예상치 못하게 이 코드에 도달함");
    } catch (error) {
      console.error("❌ [클라이언트] Google 로그인 오류:", error);
      alert("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  const handleLogin = async (
    e?: React.FormEvent,
    email?: string,
    password?: string
  ) => {
    if (e) {
      e.preventDefault();
    }
    setError("");

    const loginEmail = email || formData.email;
    const loginPassword = password || formData.password;

    if (!loginEmail || !loginPassword) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🚀 이메일 로그인 시작...");

      // 로그인 API 호출
      const response = await authApi.login({
        email: loginEmail,
        password: loginPassword,
      });

      if (response.success) {
        console.log("✅ 로그인 성공");
        alert("로그인 성공!");
        // 메인 페이지로 리디렉션 (새로고침하여 사용자 정보 로드)
        window.location.href = "/";
      }
    } catch (err: any) {
      console.error("❌ 로그인 오류:", err);
      const errorMessage =
        err.response?.data?.message || "로그인 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAccountLogin = async (email: string) => {
    await handleLogin(undefined, email, "123456");
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
          다시 만나서 반갑습니다!
        </p>
      </div>

      {/* 구글 로그인 버튼 */}
      <button
        onClick={handleGoogleLogin}
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
          {isLoading ? "로그인 중..." : "Google 계정으로 로그인"}
        </span>
      </button>

      {/* 구분선 */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            또는 이메일로 로그인
          </span>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 로그인 폼 */}
      <form onSubmit={handleLogin} className="space-y-4">
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

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            비밀번호
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력하세요"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* 로그인 유지 및 비밀번호 찾기 */}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              로그인 유지
            </span>
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-500 hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {/* 회원가입 링크 */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          아직 계정이 없으신가요?{" "}
          <Link
            href="/auth/signup"
            className="text-blue-500 hover:underline font-medium"
          >
            회원가입하기
          </Link>
        </p>
      </div>

      {/* 데모 계정 정보 */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          🎯 테스트 계정 정보(아이디를 클릭 시 즉시 로그인됩니다.)
        </h4>
        <p className="text-xs text-blue-800 dark:text-blue-300">
          아이디:{" "}
          <button
            type="button"
            onClick={() => handleTestAccountLogin("test001@gmail.com")}
            disabled={isLoading}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50"
          >
            test001@gmail.com
          </button>
          ,{" "}
          <button
            type="button"
            onClick={() => handleTestAccountLogin("test002@gmail.com")}
            disabled={isLoading}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50"
          >
            test002@gmail.com
          </button>
          <br />
          비밀번호: 123456
        </p>
      </div>
    </div>
  );
}
