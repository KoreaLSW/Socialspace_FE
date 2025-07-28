import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ApiPost } from "@/types/post";

interface ModalImageSectionProps {
  post: ApiPost;
}

export default function ModalImageSection({ post }: ModalImageSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    if (post.images && currentImageIndex < post.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // 이미지가 없으면 컴포넌트를 렌더링하지 않음
  if (!post.images || post.images.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 bg-black relative">
      <img
        src={post.images[currentImageIndex].image_url}
        alt="게시물 이미지"
        className="w-full h-full object-contain"
      />

      {/* 이미지 인디케이터 */}
      {post.images.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {post.images.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentImageIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* 이전 버튼 */}
      {post.images.length > 1 && currentImageIndex > 0 && (
        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* 다음 버튼 */}
      {post.images.length > 1 && currentImageIndex < post.images.length - 1 && (
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}
