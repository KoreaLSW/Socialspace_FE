import { useState, useCallback, useRef } from "react";
import { mutate } from "swr";
import { expressApi } from "../lib/api";
import { CreatePostData } from "./useCreatePost";

export function usePostActions() {
  const [isLoading, setIsLoading] = useState(false);
  const likeTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingLikes = useRef<Map<string, boolean>>(new Map());

  // 게시글 수정
  const updatePost = async (postId: string, data: Partial<CreatePostData>) => {
    setIsLoading(true);
    try {
      const response = await expressApi.put(`/posts/${postId}`, data);

      if (response.data.success) {
        // SWR 캐시 업데이트
        mutate(`/posts/${postId}`); // 특정 게시글 캐시 업데이트
        mutate(
          (key) => typeof key === "string" && key.startsWith("/posts"),
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
      const response = await expressApi.delete(`/posts/${postId}`);

      if (response.data.success) {
        // SWR 캐시 업데이트
        mutate(`/posts/${postId}`, undefined, { revalidate: false }); // 특정 게시글 캐시 제거
        mutate(
          (key) => typeof key === "string" && key.startsWith("/posts"),
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

  // 낙관적 업데이트로 좋아요 토글 (디바운싱 포함)
  const toggleLike = useCallback(
    (postId: string, currentIsLiked: boolean, currentCount: number) => {
      // 이전 타이머 취소
      const existingTimeout = likeTimeouts.current.get(postId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // 즉시 UI 업데이트를 위한 낙관적 캐시 업데이트
      const newIsLiked = !currentIsLiked;
      const newCount = newIsLiked ? currentCount + 1 : currentCount - 1;

      // 캐시 업데이트 (낙관적 업데이트)
      mutate(
        (key) => typeof key === "string" && key.startsWith("/posts"),
        (data: any) => {
          if (!data) return data;

          if (Array.isArray(data.data)) {
            // 게시글 목록인 경우
            return {
              ...data,
              data: data.data.map((post: any) =>
                post.id === postId
                  ? { ...post, like_count: newCount, is_liked: newIsLiked }
                  : post
              ),
            };
          } else if (data.data?.id === postId) {
            // 단일 게시글인 경우
            return {
              ...data,
              data: {
                ...data.data,
                like_count: newCount,
                is_liked: newIsLiked,
              },
            };
          }
          return data;
        },
        { revalidate: false }
      );

      // 0.5초 후 서버 요청
      const timeout = setTimeout(async () => {
        try {
          if (newIsLiked) {
            await likePost(postId);
          } else {
            await unlikePost(postId);
          }

          // 성공 시 pending 상태 제거
          pendingLikes.current.delete(postId);
        } catch (error) {
          console.error("좋아요 처리 오류:", error);

          // 실패 시 롤백
          mutate(
            (key) => typeof key === "string" && key.startsWith("/posts"),
            (data: any) => {
              if (!data) return data;

              if (Array.isArray(data.data)) {
                return {
                  ...data,
                  data: data.data.map((post: any) =>
                    post.id === postId
                      ? {
                          ...post,
                          like_count: currentCount,
                          is_liked: currentIsLiked,
                        }
                      : post
                  ),
                };
              } else if (data.data?.id === postId) {
                return {
                  ...data,
                  data: {
                    ...data.data,
                    like_count: currentCount,
                    is_liked: currentIsLiked,
                  },
                };
              }
              return data;
            },
            { revalidate: false }
          );

          pendingLikes.current.delete(postId);
        } finally {
          likeTimeouts.current.delete(postId);
        }
      }, 500);

      // 타이머와 pending 상태 저장
      likeTimeouts.current.set(postId, timeout);
      pendingLikes.current.set(postId, newIsLiked);
    },
    []
  );

  // 게시글 좋아요
  const likePost = async (postId: string) => {
    try {
      const response = await expressApi.post(`/posts/${postId}/like`);

      if (response.data.success) {
        return response.data;
      }
    } catch (error) {
      console.error("게시글 좋아요 오류:", error);
      throw error;
    }
  };

  // 게시글 좋아요 취소
  const unlikePost = async (postId: string) => {
    try {
      const response = await expressApi.delete(`/posts/${postId}/like`);

      if (response.data.success) {
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
    toggleLike,
    likePost,
    unlikePost,
    isLoading,
  };
}
