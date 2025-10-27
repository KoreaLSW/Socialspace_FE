interface FilePreviewProps {
  selectedFile: File | null;
  filePreview: string | null;
  isUploading: boolean;
  onRemoveFile: () => void;
}

export default function FilePreview({
  selectedFile,
  filePreview,
  isUploading,
  onRemoveFile,
}: FilePreviewProps) {
  if (!selectedFile || isUploading) return null;

  return (
    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center space-x-3">
        {/* 이미지 미리보기 */}
        {filePreview ? (
          <div className="relative">
            <img
              src={filePreview}
              alt="미리보기"
              className="w-16 h-16 object-cover rounded"
            />
            <button
              onClick={onRemoveFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="relative flex items-center space-x-2 bg-white dark:bg-gray-800 rounded px-3 py-2">
            <span className="text-2xl">📎</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {selectedFile.name}
            </span>
            <button
              onClick={onRemoveFile}
              className="ml-2 text-red-500 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedFile.name}
          </p>
          <p className="text-xs text-gray-500">
            {Math.round(selectedFile.size / 1024)} KB
          </p>
        </div>
      </div>
    </div>
  );
}












