import { useState, useRef } from "react";
import { mutate } from "swr";
import { expressApi } from "../lib/api";
import { CreatePostData } from "./useCreatePost";

export function usePostActions() {
  const [isLoading, setIsLoading] = useState(false);
  const processingPosts = useRef(new Set<string>()); // 현재 처리 중인 게시물들

  // 게시글 수정
  const updatePost = async (postId: string, data: Partial<CreatePostData>) => {
    setIsLoading(true);
    try {
      const response = await expressApi.put(`/posts/${postId}`, data);

      if (response.data.success) {
        // SWR 캐시 업데이트
        mutate(`/api/posts/${postId}`); // 특정 게시글 캐시 업데이트
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

  // 게시글 좋아요
  const likePost = async (postId: string) => {
    // 이미 처리 중인 게시물인지 확인
    if (processingPosts.current.has(postId)) {
      console.log(`[LIKE] 이미 처리 중인 게시물: ${postId}`);
      return;
    }
    processingPosts.current.add(postId);
    setIsLoading(true);

    try {
      // 1. 개별 게시물 캐시 optimistic update
      mutate(
        `/posts/${postId}`,
        (current: any) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: {
              ...current.data,
              is_liked: true,
              like_count: (current.data.like_count || 0) + 1,
            },
          };
        },
        { revalidate: false }
      );

      // 2. 모든 관련 캐시 optimistic update (useSWRInfinite 포함)
      mutate(
        (key) => {
          console.log("key", key);
          if (
            (Array.isArray(key) && key[0].includes("/posts?page")) ||
            (Array.isArray(key) && key[0].includes("/recommended-users")) ||
            (typeof key === "string" && key.includes("/comments/post")) ||
            (Array.isArray(key) && key[0] === "/posts?page")
          ) {
            return true;
          }
          return false;
        },
        (data: any, key: string) => {
          if (!data?.data) return data;
          // 게시물 목록인 경우
          if (Array.isArray(data.data)) {
            // 더 강력한 중복 제거 로직
            const seenIds = new Set();
            const duplicatesFound: string[] = [];
            const updatedPosts = data.data
              .filter((post: any) => {
                if (!post || !post.id) {
                  console.log(`[LIKE] 유효하지 않은 게시물 제거:`, post);
                  return false;
                }
                if (seenIds.has(post.id)) {
                  duplicatesFound.push(post.id);
                  console.log(`[LIKE] 중복 게시물 제거: ${post.id}`);
                  return false;
                }
                seenIds.add(post.id);
                return true;
              })
              .map((post: any) => {
                if (post.id === postId) {
                  console.log(`[LIKE] 좋아요 업데이트 적용: ${post.id}`);
                  return {
                    ...post,
                    is_liked: true,
                    like_count: (post.like_count || 0) + 1,
                    isLiked: true, // PostItem에서 사용하는 필드
                    likes: (post.likes || post.like_count || 0) + 1, // PostItem에서 사용하는 필드
                  };
                }
                return post;
              });

            console.log(`[LIKE] 처리 후 게시물 수: ${updatedPosts.length}`);
            if (duplicatesFound.length > 0) {
              console.log(`[LIKE] 발견된 중복 ID들:`, duplicatesFound);
            }

            return { ...data, data: updatedPosts };
          }

          // 사용자별 게시물인 경우
          if (data.data.posts && Array.isArray(data.data.posts)) {
            console.log("2222");
            // 더 강력한 중복 제거 로직
            const seenIds = new Set();
            const updatedPosts = data.data.posts
              .filter((post: any) => {
                if (!post || !post.id) return false; // 유효하지 않은 게시물 제거
                if (seenIds.has(post.id)) return false; // 중복 제거
                seenIds.add(post.id);
                return true;
              })
              .map((post: any) => {
                if (post.id === postId) {
                  console.log(`[LIKE] 좋아요 업데이트 적용: ${post.id}`);
                  return {
                    ...post,
                    is_liked: true,
                    like_count: (post.like_count || 0) + 1,
                    isLiked: true, // PostItem에서 사용하는 필드
                    likes: (post.likes || post.like_count || 0) + 1, // PostItem에서 사용하는 필드
                  };
                }
                return post;
              });
            return {
              ...data,
              data: { ...data.data, posts: updatedPosts },
            };
          }

          return data;
        },
        { revalidate: false }
      );

      // API 호출
      const response = await expressApi.post(`/posts/${postId}/like`);

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || "좋아요 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("게시글 좋아요 오류:", error);
      alert("게시글 좋아요 오류:");
      // 에러 발생 시 개별 게시물 캐시만 revalidate
      mutate(`/posts/${postId}`, undefined, { revalidate: true });

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("좋아요 처리 중 오류가 발생했습니다.");
    } finally {
      processingPosts.current.delete(postId); // 처리 완료 후 제거
      setIsLoading(false);
    }
  };

  // 게시글 좋아요 취소
  const unlikePost = async (postId: string) => {
    // 이미 처리 중인 게시물인지 확인
    if (processingPosts.current.has(postId)) {
      console.log(`[UNLIKE] 이미 처리 중인 게시물: ${postId}`);
      return;
    }

    processingPosts.current.add(postId);
    setIsLoading(true);

    try {
      // 1. 개별 게시물 캐시 optimistic update
      mutate(
        `/posts/${postId}`,
        (current: any) => {
          if (!current?.data) return current;

          return {
            ...current,
            data: {
              ...current.data,
              is_liked: false,
              like_count: Math.max(0, (current.data.like_count || 0) - 1),
            },
          };
        },
        { revalidate: false }
      );

      // 2. 모든 관련 캐시 optimistic update (useSWRInfinite 포함)
      mutate(
        (key) => {
          if (
            (Array.isArray(key) && key[0].includes("/posts?page")) ||
            (Array.isArray(key) && key[0].includes("/recommended-users")) ||
            (typeof key === "string" && key.includes("/comments/post")) ||
            (Array.isArray(key) && key[0] === "/posts?page")
          ) {
            return true;
          }
          return false;
        },
        (data: any, key: string) => {
          if (!data?.data) return data;

          // 게시물 목록인 경우
          if (Array.isArray(data.data)) {
            console.log("3333");
            // 더 강력한 중복 제거 로직
            const seenIds = new Set();
            const updatedPosts = data.data
              .filter((post: any) => {
                if (!post || !post.id) return false; // 유효하지 않은 게시물 제거
                if (seenIds.has(post.id)) return false; // 중복 제거
                seenIds.add(post.id);
                return true;
              })
              .map((post: any) => {
                if (post.id === postId) {
                  return {
                    ...post,
                    is_liked: false,
                    like_count: Math.max(0, (post.like_count || 0) - 1),
                    isLiked: false, // PostItem에서 사용하는 필드
                    likes: Math.max(
                      0,
                      (post.likes || post.like_count || 0) - 1
                    ), // PostItem에서 사용하는 필드
                  };
                }
                return post;
              });
            return { ...data, data: updatedPosts };
          }

          // 사용자별 게시물인 경우
          if (data.data.posts && Array.isArray(data.data.posts)) {
            console.log("4444");
            // 더 강력한 중복 제거 로직
            const seenIds = new Set();
            const updatedPosts = data.data.posts
              .filter((post: any) => {
                if (!post || !post.id) return false; // 유효하지 않은 게시물 제거
                if (seenIds.has(post.id)) return false; // 중복 제거
                seenIds.add(post.id);
                return true;
              })
              .map((post: any) => {
                if (post.id === postId) {
                  return {
                    ...post,
                    is_liked: false,
                    like_count: Math.max(0, (post.like_count || 0) - 1),
                    isLiked: false, // PostItem에서 사용하는 필드
                    likes: Math.max(
                      0,
                      (post.likes || post.like_count || 0) - 1
                    ), // PostItem에서 사용하는 필드
                  };
                }
                return post;
              });
            return {
              ...data,
              data: { ...data.data, posts: updatedPosts },
            };
          }

          return data;
        },
        { revalidate: false }
      );

      // API 호출
      const response = await expressApi.delete(`/posts/${postId}/like`);

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || "좋아요 취소에 실패했습니다.");
      }
    } catch (error) {
      console.error("게시글 좋아요 취소 오류:", error);
      alert("게시글 좋아요 오류:");

      // 에러 발생 시 개별 게시물 캐시만 revalidate
      mutate(`/posts/${postId}`, undefined, { revalidate: true });

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("좋아요 취소 처리 중 오류가 발생했습니다.");
    } finally {
      processingPosts.current.delete(postId); // 처리 완료 후 제거
      setIsLoading(false);
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
