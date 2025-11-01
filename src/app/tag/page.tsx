"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TagIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // 태그가 지정되지 않은 경우 홈으로 리다이렉트 또는 안내 메시지 표시
    // 필요에 따라 태그 목록 페이지로 변경 가능
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <h1 className="text-2xl font-bold mb-4">태그 검색</h1>
        <p>게시물의 해시태그를 클릭하여 태그 페이지를 확인하세요.</p>
      </div>
    </div>
  );
}
