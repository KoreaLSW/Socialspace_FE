import { useState } from "react";
import { useSession } from "next-auth/react";
import { mutate } from "swr";
import { postsApi } from "@/lib/api";

export interface CreatePostData {
  content: string;
  visibility: "public" | "followers" | "private";
  hideViews: boolean;
  hideLikes: boolean;
  allowComments: boolean;
  images?: File[];
}

export const useCreatePost = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPost = async (data: CreatePostData) => {
    if (!session) {
      setError("로그인이 필요합니다.");
      return { success: false, error: "로그인이 필요합니다." };
    }

    try {
      setIsLoading(true);
      setError(null);

      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        setIsUploading(true);

        const imageCount = data.images.length;

        if (imageCount === 1) {
          // 🚀 이미지가 1개일 경우: uploadSingleImage 호출
          const formData = new FormData();
          formData.append("image", data.images[0]);
          const response = await postsApi.uploadImage(formData);
          // API가 { data: { imageUrl: '...' } } 형태로 응답한다고 가정
          imageUrls = [response.data.imageUrl];
        } else {
          // 🚀 이미지가 2개 이상일 경우: uploadMultipleImages 호출
          const formData = new FormData();
          // 'images' 라는 동일한 키로 모든 이미지 파일을 추가
          data.images.forEach((image) => {
            formData.append("images", image);
          });
          const response = await postsApi.uploadImages(formData);
          // API가 { data: { imageUrls: ['...', '...'] } } 형태로 응답한다고 가정
          console.log("🔍🔍🔍 이미지 업로드 성공:", response.data);
          response.data.forEach((item: any) => {
            imageUrls.push(item.url);
          });
        }

        setIsUploading(false);
      }

      // 게시글 생성 요청 로직은 기존과 동일
      const postData = {
        content: data.content,
        visibility: data.visibility,
        hide_views: data.hideViews,
        hide_likes: data.hideLikes,
        allow_comments: data.allowComments,
        images: imageUrls,
      };

      const result = await postsApi.create(postData);

      if (result.success) {
        // SWR 캐시 갱신
        mutate(
          (key) => typeof key === "string" && key.includes("/posts"),
          undefined,
          { revalidate: true }
        );
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || "게시글 생성에 실패했습니다.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "게시글 생성 중 오류가 발생했습니다.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  return {
    submitPost,
    isLoading,
    isUploading,
    error,
  };
};
