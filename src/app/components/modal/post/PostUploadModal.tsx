"use client";

interface PostUploadModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isUploading: boolean;
  imageCount?: number;
  currentImageIndex?: number;
  uploadProgress?: number;
}

export default function PostUploadModal({
  isOpen,
  isLoading,
  isUploading,
  imageCount = 0,
  currentImageIndex = 0,
  uploadProgress = 0,
}: PostUploadModalProps) {
  if (!isOpen) return null;

  const getCurrentStep = () => {
    if (isUploading) {
      return {
        title: "이미지 업로드 중...",
        description:
          imageCount > 0
            ? `이미지 ${currentImageIndex + 1}/${imageCount} 업로드 중`
            : "이미지 업로드 중",
        progress: uploadProgress > 0 ? uploadProgress : undefined,
      };
    }
    if (isLoading) {
      return {
        title: "게시물 작성 중...",
        description: "게시물을 서버에 저장하고 있습니다",
        progress: undefined,
      };
    }
    return null;
  };

  const step = getCurrentStep();
  if (!step) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* 로딩 스피너 */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            {/* 외부 회전 원 */}
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            {/* 내부 회전 원 */}
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
          </div>

          {/* 제목 */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {step.description}
            </p>
          </div>

          {/* 진행률 바 (업로드 중이고 진행률이 있을 때만 표시) */}
          {step.progress !== undefined && (
            <div className="w-full">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${step.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                {step.progress}%
              </p>
            </div>
          )}

          {/* 이미지 개수가 여러 개일 때 점 표시 */}
          {imageCount > 1 && isUploading && (
            <div className="flex space-x-2 mt-2">
              {Array.from({ length: imageCount }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index <= currentImageIndex
                      ? "bg-blue-600 dark:bg-blue-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                ></div>
              ))}
            </div>
          )}

          {/* 안내 메시지 */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            잠시만 기다려주세요...
          </p>
        </div>
      </div>
    </div>
  );
}


