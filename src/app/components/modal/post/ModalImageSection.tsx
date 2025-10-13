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
    <div className="flex-1 bg-black lg:flex-1 lg:max-w-none max-h-[40vh] lg:max-h-none min-h-[250px] lg:min-h-0 sm:max-h-[35vh] sm:min-h-[200px] rounded-t-lg lg:rounded-l-lg lg:rounded-t-none">
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
