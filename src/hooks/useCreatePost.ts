import { useState } from "react";
import { mutate } from "swr";
import { postsApi } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useAuth";

export interface CreatePostData {
  content: string;
  visibility: "public" | "followers" | "private";
  hideViews: boolean;
  hideLikes: boolean;
  allowComments: boolean;
  images?: File[];
  hashtags?: string[];
}

export const useCreatePost = () => {
  const { user, isAuthenticated } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(0);

  const submitPost = async (data: CreatePostData) => {
    if (!isAuthenticated || !user) {
      setError("로그인이 필요합니다.");
      return { success: false, error: "로그인이 필요합니다." };
    }

    try {
      setIsLoading(true);
      setError(null);

      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        setIsUploading(true);
        setTotalImages(data.images.length);
        setCurrentImageIndex(0);
        setUploadProgress(0);

        const imageCount = data.images.length;

        if (imageCount === 1) {
          // 🚀 이미지가 1개일 경우: uploadSingleImage 호출
          setUploadProgress(50);
          const formData = new FormData();
          formData.append("image", data.images[0]);
          const response = await postsApi.uploadImage(formData);
          // API가 { data: { imageUrl: '...' } } 형태로 응답한다고 가정
          imageUrls = [response.data.imageUrl];
          setUploadProgress(100);
        } else {
          // 🚀 이미지가 2개 이상일 경우: 각 이미지를 순차적으로 업로드
          // 순차 업로드로 진행률을 정확히 추적
          for (let i = 0; i < imageCount; i++) {
            setCurrentImageIndex(i);

            // 현재 이미지의 시작 진행률 계산 (0% ~ 90%)
            const startProgress = (i / imageCount) * 90;
            const endProgress = ((i + 1) / imageCount) * 90;

            setUploadProgress(Math.round(startProgress));

            // 단일 이미지 업로드
            const formData = new FormData();
            formData.append("image", data.images[i]);

            try {
              const response = await postsApi.uploadImage(formData);
              imageUrls.push(response.data.imageUrl);

              // 현재 이미지 업로드 완료
              setUploadProgress(Math.round(endProgress));

              // 마지막 이미지가 아닌 경우 잠시 대기 (UI 업데이트를 위해)
              if (i < imageCount - 1) {
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
            } catch (error) {
              throw error;
            }
          }

          // 모든 이미지 업로드 완료
          setCurrentImageIndex(imageCount - 1);
          setUploadProgress(100);
        }

        setIsUploading(false);
        setUploadProgress(0);
        setCurrentImageIndex(0);
        setTotalImages(0);
      }

      // 게시글 생성 요청 로직은 기존과 동일
      const postData = {
        content: data.content,
        visibility: data.visibility,
        hide_views: data.hideViews,
        hide_likes: data.hideLikes,
        allow_comments: data.allowComments,
        images: imageUrls,
        hashtags: data.hashtags || [],
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
    uploadProgress,
    currentImageIndex,
    totalImages,
  };
};
