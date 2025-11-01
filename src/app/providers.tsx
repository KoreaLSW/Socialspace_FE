"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { fetcher } from "../lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // 5분마다 세션 갱신 (초 단위)
      refetchOnWindowFocus={false} // 윈도우 포커스 시 자동 갱신 비활성화
    >
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          refreshInterval: 0,
          dedupingInterval: 2000,
          errorRetryCount: 3,
          errorRetryInterval: 5000,
          onError: (error) => {
            console.error("SWR Error:", error);
          },
          onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
            // 404 에러는 재시도하지 않음
            if (error.status === 404) return;

            // 401 에러는 재시도하지 않음 (이미 api.ts에서 처리)
            if (error.status === 401) return;

            // 최대 재시도 횟수 초과시 중단
            if (retryCount >= 3) return;

            // 5초 후 재시도
            setTimeout(() => revalidate({ retryCount }), 5000);
          },
        }}
      >
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}
