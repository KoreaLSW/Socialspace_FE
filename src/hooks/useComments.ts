import { useState } from "react";
import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import * as commentsApi from "../lib/api/comments";
import { InfinitePostsMutateFunction } from "./usePosts";
import { SWRInfiniteKeyedMutator } from "swr/infinite";

// 낙관적 업데이트를 위한 타입 정의
export interface OptimisticComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  parent_id?: string;
  reply_to_comment_id?: string;
  author: {
    id: string;
    username: string;
    nickname: string;
    profileImage?: string;
  };
  like_count: number;
  is_liked: boolean;
}

export function useComments(postId: string) {
  const [isLoading, setIsLoading] = useState(false);

  // ===== 댓글 목록 조회 (무한 스크롤) =====
  const PAGE_SIZE = 20;
  const {
    data: pages,
    error,
    mutate: mutateComments,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite(
    (pageIndex, previousPage: any) => {
      if (!postId) return null;
      if (previousPage && previousPage.pagination) {
        const { page, totalPages } = previousPage.pagination;
        if (pageIndex > 0 && page >= totalPages) return null;
      }
      return ["comments", postId, pageIndex + 1, PAGE_SIZE];
    },
    ([, id, page, limit]) =>
      commentsApi.getCommentsByPostId(
        id as string,
        page as number,
        limit as number
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      dedupingInterval: 500,
    }
  );

  const comments = (pages || []).flatMap((p: any) => p?.data || []);
  const totalPages = pages?.[0]?.pagination?.totalPages || 0;
  const hasMore = size < totalPages;
  const total = pages?.[0]?.pagination?.total ?? comments.length;

  // 로딩 상태 세분화 (초기/추가 로딩 구분)
  const isLoadingInitialData = !pages && isValidating;
  const isLoadingMore = !isLoadingInitialData && isValidating && size > 1; // 다음 페이지 로딩 중

  // ===== 댓글 작성 시 낙관적 업데이트 =====
  const optimisticCommentCreate = async (
    content: string,
    currentUser: any,
    mutatePosts?: InfinitePostsMutateFunction,
    mutateUserPosts?: SWRInfiniteKeyedMutator<any>
  ) => {
    // 낙관적 업데이트: 즉시 UI에 댓글 표시
    const optimisticComment: OptimisticComment = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      post_id: postId,
      user_id: currentUser.id!,
      content,
      is_edited: false,
      created_at: new Date().toISOString(),
      author: {
        id: currentUser.id!,
        username: currentUser.username || "",
        nickname: currentUser.nickname || currentUser.username || "사용자",
        profileImage: currentUser.profileImage,
      },
      like_count: 0,
      is_liked: false,
    };

    // 댓글 목록에 즉시 추가 (낙관적 업데이트)
    mutateComments((current: any) => {
      if (!current?.data) return current;
      return {
        ...current,
        data: [...(current.data || []), optimisticComment],
      };
    }, false);

    // 게시글 목록 캐시에도 낙관적 댓글 수 증가 반영
    const incrementCount = (pages: any[] | undefined) => {
      if (!Array.isArray(pages)) return pages as any;
      return pages.map((page: any) => {
        if (!page?.data || !Array.isArray(page.data)) return page;
        const updatedData = page.data.map((p: any) => {
          if (!p || p.id !== postId) return p;
          return { ...p, comment_count: (p.comment_count || 0) + 1 };
        });
        return { ...page, data: updatedData };
      });
    };

    // 사용자 게시글(프로필 탭) 무한스크롤 캐시 갱신
    if (mutateUserPosts) {
      await mutateUserPosts((current: any) => incrementCount(current), false);
    }
    // 전체 피드 무한스크롤 캐시 갱신
    if (mutatePosts) {
      await mutatePosts((current: any) => incrementCount(current), false);
    }

    return optimisticComment;
  };

  // ===== 낙관적 댓글 업데이트 롤백 =====
  const rollbackOptimisticComment = async (
    mutatePosts?: InfinitePostsMutateFunction,
    mutateUserPosts?: SWRInfiniteKeyedMutator<any>
  ) => {
    // 에러 발생 시 댓글 목록 새로고침
    mutateComments();

    // 실패 시 낙관적 증가 되돌리기
    const decrementCount = (pages: any[] | undefined) => {
      if (!Array.isArray(pages)) return pages as any;
      return pages.map((page: any) => {
        if (!page?.data || !Array.isArray(page.data)) return page;
        const updatedData = page.data.map((p: any) => {
          if (!p || p.id !== postId) return p;
          const next = (p.comment_count || 0) - 1;
          return { ...p, comment_count: next > 0 ? next : 0 };
        });
        return { ...page, data: updatedData };
      });
    };

    if (mutateUserPosts) {
      await mutateUserPosts((current: any) => decrementCount(current), false);
    }
    if (mutatePosts) {
      await mutatePosts((current: any) => decrementCount(current), false);
    }
  };

  // ===== 댓글 생성 =====
  const createComment = async (
    content: string,
    parentId?: string,
    replyToCommentId?: string
  ) => {
    setIsLoading(true);
    try {
      const commentData: commentsApi.CreateCommentData = {
        post_id: postId,
        content,
        parent_id: parentId,
        reply_to_comment_id: replyToCommentId,
      };

      // 게시글 목록의 댓글 수 즉시 증가 (낙관적 업데이트)
      mutate(
        (key) =>
          typeof key === "string" &&
          (key.includes("/posts") || key.startsWith("/posts")),
        (data: any) => {
          if (!data?.data) return data;

          // 게시물 목록인 경우
          if (Array.isArray(data.data)) {
            const updatedPosts = data.data.map((post: any) => {
              if (post.id === postId) {
                return {
                  ...post,
                  comment_count: (post.comment_count || 0) + 1,
                };
              }
              return post;
            });
            return { ...data, data: updatedPosts };
          }

          // 단일 게시물인 경우
          if (data.data.id === postId) {
            return {
              ...data,
              data: {
                ...data.data,
                comment_count: (data.data.comment_count || 0) + 1,
              },
            };
          }

          return data;
        },
        { revalidate: false }
      );

      const response = await commentsApi.createComment(commentData);

      if (response.success) {
        // 댓글 목록 갱신 (첫 페이지부터 재검증)
        mutateComments();

        return response.data;
      } else {
        // 실패 시 게시글 목록 롤백
        mutate(
          (key) =>
            typeof key === "string" &&
            (key.includes("/posts") || key.startsWith("/posts")),
          undefined,
          { revalidate: true }
        );
        throw new Error(response.message || "댓글 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);

      // 에러 발생 시 게시글 목록 새로고침
      mutate(
        (key) =>
          typeof key === "string" &&
          (key.includes("/posts") || key.startsWith("/posts")),
        undefined,
        { revalidate: true }
      );

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("댓글 작성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 댓글 수정 =====
  const updateComment = async (commentId: string, content: string) => {
    setIsLoading(true);
    try {
      const response = await commentsApi.updateComment(commentId, content);

      if (response.success) {
        mutateComments();
        return response.data;
      } else {
        throw new Error(response.message || "댓글 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("댓글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 댓글 삭제 =====
  const deleteComment = async (commentId: string) => {
    setIsLoading(true);
    try {
      const response = await commentsApi.deleteComment(commentId);

      if (response.success) {
        mutateComments();

        // 게시글 목록의 댓글 수도 업데이트
        mutate(
          (key) => typeof key === "string" && key.includes("/posts"),
          undefined,
          { revalidate: true }
        );

        return true;
      } else {
        throw new Error(response.message || "댓글 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error("댓글 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // ===== 기본 댓글 데이터 =====
    comments,
    isLoading: isLoadingInitialData,
    isLoadingMore,
    error,
    size,
    setSize,
    hasMore,
    total,

    // ===== 댓글 CRUD 함수 =====
    createComment,
    updateComment,
    deleteComment,
    mutateComments,

    // ===== 대댓글 관련 =====
    // useReplies, // Removed as per edit hint

    // ===== 낙관적 업데이트 함수 =====
    optimisticCommentCreate,
    rollbackOptimisticComment,
  };
}
