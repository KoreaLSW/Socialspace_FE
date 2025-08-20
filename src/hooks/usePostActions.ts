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
      // 1) 낙관적 업데이트 적용
      const nowIso = new Date().toISOString();

      // 단건 캐시 (배열 키와 문자열 키 모두 지원)
      mutate(
        ["post", postId],
        (current: any) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: {
              ...current.data,
              content: data.content ?? current.data.content,
              visibility: (data as any).visibility ?? current.data.visibility,
              hide_likes: (data as any).hide_likes ?? current.data.hide_likes,
              hide_views: (data as any).hide_views ?? current.data.hide_views,
              allow_comments:
                (data as any).allow_comments ?? current.data.allow_comments,
              updated_at: nowIso,
              is_edited: true,
            },
          };
        },
        { revalidate: false }
      );
      mutate(
        `/posts/${postId}`,
        (current: any) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: {
              ...current.data,
              content: data.content ?? current.data.content,
              visibility: (data as any).visibility ?? current.data.visibility,
              hide_likes: (data as any).hide_likes ?? current.data.hide_likes,
              hide_views: (data as any).hide_views ?? current.data.hide_views,
              allow_comments:
                (data as any).allow_comments ?? current.data.allow_comments,
              updated_at: nowIso,
              is_edited: true,
            },
          };
        },
        { revalidate: false }
      );

      // 무한스크롤 피드 및 사용자 피드
      mutate(
        (key) => Array.isArray(key) && key[0] === "/posts",
        (pages: any) => {
          if (!Array.isArray(pages)) return pages;
          return pages.map((page: any) => {
            if (!page?.data) return page;
            const nextData = page.data.map((p: any) =>
              p?.id === postId
                ? {
                    ...p,
                    content: data.content ?? p.content,
                    visibility: (data as any).visibility ?? p.visibility,
                    hide_likes: (data as any).hide_likes ?? p.hide_likes,
                    hide_views: (data as any).hide_views ?? p.hide_views,
                    allow_comments:
                      (data as any).allow_comments ?? p.allow_comments,
                    updated_at: nowIso,
                    is_edited: true,
                  }
                : p
            );
            return { ...page, data: nextData };
          });
        },
        { revalidate: false }
      );
      mutate(
        (key) => Array.isArray(key) && key[0] === "/user-posts",
        (pages: any) => {
          if (!Array.isArray(pages)) return pages;
          return pages.map((page: any) => {
            if (!page?.data) return page;
            const nextData = page.data.map((p: any) =>
              p?.id === postId
                ? {
                    ...p,
                    content: data.content ?? p.content,
                    visibility: (data as any).visibility ?? p.visibility,
                    hide_likes: (data as any).hide_likes ?? p.hide_likes,
                    hide_views: (data as any).hide_views ?? p.hide_views,
                    allow_comments:
                      (data as any).allow_comments ?? p.allow_comments,
                    updated_at: nowIso,
                    is_edited: true,
                  }
                : p
            );
            return { ...page, data: nextData };
          });
        },
        { revalidate: false }
      );

      // 2) 서버 요청
      const response = await expressApi.put(`/posts/${postId}`, data);

      if (response.data.success) {
        const updated = response.data.data;

        // 성공 시 서버 응답으로 캐시 정확화
        mutate(
          ["post", postId],
          (current: any) => {
            if (!current?.data) return current;
            return {
              ...current,
              data: {
                ...current.data,
                content: updated.content,
                visibility: updated.visibility,
                hide_likes: updated.hide_likes,
                hide_views: updated.hide_views,
                allow_comments: updated.allow_comments,
                updated_at: updated.updated_at,
                is_edited: true,
              },
            };
          },
          { revalidate: false }
        );
        mutate(
          `/posts/${postId}`,
          (current: any) => {
            if (!current?.data) return current;
            return {
              ...current,
              data: {
                ...current.data,
                content: updated.content,
                visibility: updated.visibility,
                hide_likes: updated.hide_likes,
                hide_views: updated.hide_views,
                allow_comments: updated.allow_comments,
                updated_at: updated.updated_at,
                is_edited: true,
              },
            };
          },
          { revalidate: false }
        );
        mutate(
          (key) => Array.isArray(key) && key[0] === "/posts",
          (pages: any) => {
            if (!Array.isArray(pages)) return pages;
            return pages.map((page: any) => {
              if (!page?.data) return page;
              const nextData = page.data.map((p: any) =>
                p?.id === postId
                  ? {
                      ...p,
                      content: updated.content,
                      visibility: updated.visibility,
                      hide_likes: updated.hide_likes,
                      hide_views: updated.hide_views,
                      allow_comments: updated.allow_comments,
                      updated_at: updated.updated_at,
                      is_edited: true,
                    }
                  : p
              );
              return { ...page, data: nextData };
            });
          },
          { revalidate: false }
        );
        mutate(
          (key) => Array.isArray(key) && key[0] === "/user-posts",
          (pages: any) => {
            if (!Array.isArray(pages)) return pages;
            return pages.map((page: any) => {
              if (!page?.data) return page;
              const nextData = page.data.map((p: any) =>
                p?.id === postId
                  ? {
                      ...p,
                      content: updated.content,
                      visibility: updated.visibility,
                      hide_likes: updated.hide_likes,
                      hide_views: updated.hide_views,
                      allow_comments: updated.allow_comments,
                      updated_at: updated.updated_at,
                      is_edited: true,
                    }
                  : p
              );
              return { ...page, data: nextData };
            });
          },
          { revalidate: false }
        );

        return updated;
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
      // 실패 시에도 서버 소스로 재검증하여 낙관적 업데이트 롤백 보장
      mutate(["post", postId], undefined, { revalidate: true });
      mutate(`/posts/${postId}`, undefined, { revalidate: true });
      mutate((key) => Array.isArray(key) && key[0] === "/posts", undefined, {
        revalidate: true,
      });
      mutate(
        (key) => Array.isArray(key) && key[0] === "/user-posts",
        undefined,
        { revalidate: true }
      );
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
        // 1) 개별 게시글 캐시 제거
        mutate(`/posts/${postId}`, undefined, { revalidate: false });

        // 2) 무한스크롤 목록에서 해당 게시글 제거 (키 패턴: useInfinitePosts → ["/posts", page, limit])
        mutate(
          (key) => Array.isArray(key) && key[0] === "/posts",
          (current: any) => {
            if (!current) return current;
            // useSWRInfinite일 경우: 페이지 배열
            if (Array.isArray(current)) {
              return current.map((page: any) => {
                if (!page?.data) return page;
                return {
                  ...page,
                  data: page.data.filter((p: any) => p?.id !== postId),
                };
              });
            }
            // 단일 페이지(useSWR) 응답 형태
            if (current?.data && Array.isArray(current.data)) {
              return {
                ...current,
                data: current.data.filter((p: any) => p?.id !== postId),
              };
            }
            return current;
          },
          { revalidate: false }
        );

        // 3) 사용자별 게시글 무한스크롤 목록에서도 제거 (키 패턴: ["/user-posts", userId, type, page, limit])
        mutate(
          (key) => Array.isArray(key) && key[0] === "/user-posts",
          (current: any) => {
            if (!current) return current;
            if (Array.isArray(current)) {
              return current.map((page: any) => {
                if (!page?.data) return page;
                return {
                  ...page,
                  data: page.data.filter((p: any) => p?.id !== postId),
                };
              });
            }
            if (current?.data && Array.isArray(current.data)) {
              return {
                ...current,
                data: current.data.filter((p: any) => p?.id !== postId),
              };
            }
            return current;
          },
          { revalidate: false }
        );

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

      // 2. 개별 게시물 캐시와 모달용 캐시 업데이트 (목록은 LikeButton에서 처리)
      mutate(
        (key) => {
          // 개별 게시물 캐시 패턴
          if (
            typeof key === "string" &&
            key.startsWith("/posts/") &&
            key !== "/posts"
          )
            return true;
          return false;
        },
        (data: any, key: any) => {
          if (!data?.data) return data;

          // 개별 게시물인 경우
          if (
            typeof key === "string" &&
            key.startsWith("/posts/") &&
            !Array.isArray(data.data)
          ) {
            if (data.data.id === postId) {
              console.log(`[LIKE] 개별 게시물 좋아요 업데이트: ${postId}`);
              return {
                ...data,
                data: {
                  ...data.data,
                  is_liked: true,
                  like_count: (data.data.like_count || 0) + 1,
                  isLiked: true,
                  likes: (data.data.likes || data.data.like_count || 0) + 1,
                },
              };
            }
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
          // 개별 게시물 캐시 패턴
          if (
            typeof key === "string" &&
            key.startsWith("/posts/") &&
            key !== "/posts"
          )
            return true;
          return false;
        },
        (data: any, key: any) => {
          if (!data?.data) return data;

          // 개별 게시물인 경우
          if (
            typeof key === "string" &&
            key.startsWith("/posts/") &&
            !Array.isArray(data.data)
          ) {
            if (data.data.id === postId) {
              console.log(
                `[UNLIKE] 개별 게시물 좋아요 취소 업데이트: ${postId}`
              );
              return {
                ...data,
                data: {
                  ...data.data,
                  is_liked: false,
                  like_count: Math.max(0, (data.data.like_count || 0) - 1),
                  isLiked: false,
                  likes: Math.max(
                    0,
                    (data.data.likes || data.data.like_count || 0) - 1
                  ),
                },
              };
            }
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
