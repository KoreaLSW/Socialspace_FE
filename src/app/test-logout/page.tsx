"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function TestLogoutPage() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const clearEverything = async () => {
      try {
        // Step 1: NextAuth 로그아웃
        setStep(1);
        await signOut({ redirect: false });

        // Step 2: 로컬 스토리지 삭제
        setStep(2);
        localStorage.clear();
        sessionStorage.clear();

        // Step 3: 쿠키 삭제
        setStep(3);
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/"
            );
        });

        setStep(4);
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 1500);
      } catch (error) {
        console.error("로그아웃 실패:", error);
        setStep(999);
      }
    };

    clearEverything();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">
          세션 초기화 중...
        </h1>

        <div className="space-y-4">
          <div
            className={`flex items-center ${
              step >= 1 ? "text-green-600" : "text-gray-400"
            }`}
          >
            <span className="mr-2">{step >= 1 ? "✅" : "⏳"}</span>
            <span>NextAuth 로그아웃</span>
          </div>

          <div
            className={`flex items-center ${
              step >= 2 ? "text-green-600" : "text-gray-400"
            }`}
          >
            <span className="mr-2">{step >= 2 ? "✅" : "⏳"}</span>
            <span>스토리지 삭제</span>
          </div>

          <div
            className={`flex items-center ${
              step >= 3 ? "text-green-600" : "text-gray-400"
            }`}
          >
            <span className="mr-2">{step >= 3 ? "✅" : "⏳"}</span>
            <span>쿠키 삭제</span>
          </div>

          <div
            className={`flex items-center ${
              step >= 4 ? "text-green-600" : "text-gray-400"
            }`}
          >
            <span className="mr-2">{step >= 4 ? "✅" : "⏳"}</span>
            <span>로그인 페이지로 이동</span>
          </div>

          {step === 999 && (
            <div className="text-red-600 text-center mt-4">
              ❌ 오류가 발생했습니다. 수동으로 로그아웃 해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




