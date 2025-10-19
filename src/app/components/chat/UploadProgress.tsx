interface UploadProgressProps {
  isUploading: boolean;
  uploadProgress: number;
}

export default function UploadProgress({
  isUploading,
  uploadProgress,
}: UploadProgressProps) {
  if (!isUploading) return null;

  return (
    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              파일 업로드 중...
            </span>
            <span className="text-sm font-medium text-blue-500">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}





