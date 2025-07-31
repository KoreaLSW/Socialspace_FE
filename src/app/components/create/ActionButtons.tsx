import { Image } from "lucide-react";

interface ActionButtonsProps {
  images: File[];
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCancel: () => void;
  handleSubmit: () => void;
  content: string;
  isUploading: boolean;
  isLoading: boolean;
}

export default function ActionButtons({
  images,
  handleImageUpload,
  handleCancel,
  handleSubmit,
  content,
  isUploading,
  isLoading,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div className="flex items-center space-x-2">
        <label className="cursor-pointer p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
          <Image size={20} />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading || isLoading}
          />
        </label>
        <span className="text-sm text-gray-500">{images.length}/5 이미지</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleCancel}
          disabled={isUploading || isLoading}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isUploading || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "업로드 중..." : isLoading ? "게시 중..." : "게시하기"}
        </button>
      </div>
    </div>
  );
}
