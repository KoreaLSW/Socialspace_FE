import { useState } from "react";
import { mutate } from "swr";
import { expressApi } from "../lib/api";
import { CreatePostData } from "./useCreatePost";

export function usePostActions() {
  const [isLoading, setIsLoading] = useState(false);

  // 게시글 수정
  const updatePost = async (postId: string, data: Partial<CreatePostData>) => {
    setIsLoading(true);
    try {
      const response = await expressApi.put(`/api/posts/${postId}`, data);

      if (response.data.success) {
        // SWR 캐시 업데이트
        mutate(`/api/posts/${postId}`); // 특정 게시글 캐시 업데이트
        mutate(
          (key) => typeof key === "string" && key.startsWith("/api/posts"),
          undefined,
          { revalidate: true }
        ); // 모든 게시글 목록 캐시 업데이트

        return response.data.data;
      } else {
        throw new Error(response.data.message || "게시글 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("게시글 수정 오류:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 게시글 삭제
  const deletePost = async (postId: string) => {
    setIsLoading(true);
    try {
      const response = await expressApi.delete(`/api/posts/${postId}`);

      if (response.data.success) {
        // SWR 캐시 업데이트
        mutate(`/api/posts/${postId}`, undefined, { revalidate: false }); // 특정 게시글 캐시 제거
        mutate(
          (key) => typeof key === "string" && key.startsWith("/api/posts"),
          undefined,
          { revalidate: true }
        ); // 모든 게시글 목록 캐시 업데이트

        return response.data;
      } else {
        throw new Error(response.data.message || "게시글 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("게시글 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 게시글 좋아요 (향후 구현 예정)
  const likePost = async (postId: string) => {
    try {
      const response = await expressApi.post(`/api/posts/${postId}/like`);

      if (response.data.success) {
        // SWR 캐시 업데이트
        mutate(`/api/posts/${postId}`);
        mutate(
          (key) => typeof key === "string" && key.startsWith("/api/posts"),
          undefined,
          { revalidate: false }
        );

        return response.data;
      }
    } catch (error) {
      console.error("게시글 좋아요 오류:", error);
      throw error;
    }
  };

  // 게시글 좋아요 취소 (향후 구현 예정)
  const unlikePost = async (postId: string) => {
    try {
      const response = await expressApi.delete(`/api/posts/${postId}/like`);

      if (response.data.success) {
        // SWR 캐시 업데이트
        mutate(`/api/posts/${postId}`);
        mutate(
          (key) => typeof key === "string" && key.startsWith("/api/posts"),
          undefined,
          { revalidate: false }
        );

        return response.data;
      }
    } catch (error) {
      console.error("게시글 좋아요 취소 오류:", error);
      throw error;
    }
  };

  return {
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    isLoading,
  };
}
