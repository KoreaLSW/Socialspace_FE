import { ApiPost } from "@/types/post";
import ImageSlider from "../../common/ImageSlider";

interface ModalImageSectionProps {
  post: ApiPost;
  initialImageIndex?: number;
}

export default function ModalImageSection({
  post,
  initialImageIndex = 0,
}: ModalImageSectionProps) {
  // 이미지가 없으면 컴포넌트를 렌더링하지 않음
  if (!post.images || post.images.length === 0) {
    return null;
  }

  // ApiPost의 images를 string 배열로 변환
  const imageUrls = post.images.map((img) => img.image_url);

  return (
    <div className="flex-1 bg-black">
      <ImageSlider
        images={imageUrls}
        className="h-full"
        resetKey={post.id}
        isModal={true}
        initialIndex={initialImageIndex}
      />
    </div>
  );
}
