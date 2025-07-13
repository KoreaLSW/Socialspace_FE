import { useState } from "react";
import { useSession } from "next-auth/react";
import { mutate } from "swr";
import { postsApi } from "@/lib/api";

interface CreatePostData {
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

      // 이미지 업로드 처리
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        setIsUploading(true);

        // 각 이미지를 FormData로 업로드
        const uploadPromises = data.images.map(async (image) => {
          const formData = new FormData();
          formData.append("image", image);

          const response = await postsApi.uploadImage(formData);
          return response.data.imageUrl;
        });

        imageUrls = await Promise.all(uploadPromises);
        setIsUploading(false);
      }

      // 게시글 생성 요청
      const postData = {
        content: data.content,
        visibility: data.visibility,
        hide_views: data.hideViews,
        hide_likes: data.hideLikes,
        allow_comments: data.allowComments,
        images: imageUrls,
      };

      console.log("🚀 게시글 생성 요청:", postData);

      const result = await postsApi.create(postData);

      if (result.success) {
        console.log("✅ 게시글 생성 성공:", result.data);

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
      console.error("❌ 게시글 생성 실패:", errorMessage);
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
