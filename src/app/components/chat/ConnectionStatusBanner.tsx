interface ConnectionStatusBannerProps {
  isConnected: boolean;
}

export default function ConnectionStatusBanner({
  isConnected,
}: ConnectionStatusBannerProps) {
  if (isConnected) return null;

  return (
    <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              연결 끊김
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              재연결 중입니다. 메시지 전송이 지연될 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

