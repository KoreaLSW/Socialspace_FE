import { mutate } from "swr";
import * as commentsApi from "../lib/api/comments";
import useSWRInfinite from "swr/infinite";
import { useCallback } from "react";

// 낙관적 업데이트를 위한 타입 정의
export interface OptimisticReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  parent_id: string;
  reply_to_comment_id: string;
  author: {
    id: string;
    username: string;
    nickname: string;
    profileImage?: string;
  };
  like_count: number;
  is_liked: boolean;
}

// ===== 대댓글 조회 훅 (무한 스크롤) =====
export const useReplies = (parentId: string | undefined) => {
  const REPLY_PAGE_SIZE = 10;

  const {
    data: replyPages,
    error: replyError,
    isLoading: replyIsLoading,
    mutate: mutateReplies,
    size: replySize,
    setSize: setReplySizeOriginal,
    isValidating: replyIsValidating,
  } = useSWRInfinite(
    (pageIndex, previousPage: any) => {
      if (!parentId || parentId === "") return null;
      if (previousPage && previousPage.pagination) {
        const { page, totalPages } = previousPage.pagination;
        if (pageIndex > 0 && page >= totalPages) return null;
      }
      const key = ["replies", parentId, pageIndex + 1, REPLY_PAGE_SIZE];
      return key;
    },
    ([, id, page, limit]) =>
      commentsApi.getRepliesByCommentId(
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

  // setReplySize를 안정화
  const setReplySize = useCallback(
    (size: number | ((prev: number) => number)) => {
      setReplySizeOriginal(size);
    },
    [setReplySizeOriginal]
  );

  const replies = (replyPages || []).flatMap((p: any) => p?.data || []);
  const replyTotalPages = replyPages?.[0]?.pagination?.totalPages || 0;
  const replyHasMore = replySize < replyTotalPages;
  const replyTotal = replyPages?.[0]?.pagination?.total ?? replies.length;

  // 로딩 상태 세분화 (초기/추가 로딩 구분)
  const replyIsLoadingInitialData = !replyPages && replyIsValidating;
  const replyIsLoadingMore =
    !replyIsLoadingInitialData && replyIsValidating && replySize > 1;

  return {
    replies,
    isLoading: replyIsLoadingInitialData,
    isLoadingMore: replyIsLoadingMore,
    error: replyError,
    mutateReplies,
    replySize,
    setReplySize,
    replyHasMore,
    replyTotal,
  };
};

// ===== 대댓글 작성 시 낙관적 업데이트 =====
export const optimisticReplyCreate = async (
  content: string,
  currentUser: any,
  parentId: string,
  replyToCommentId: string,
  postId: string,
  mutateComments: (updater: any, options?: any) => void,
  mutateReplies: (updater: any, options?: any) => void
) => {
  // 낙관적 업데이트: 즉시 UI에 대댓글 표시
  const optimisticReply: OptimisticReply = {
    id: `temp_reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    post_id: postId,
    user_id: currentUser?.id!,
    content,
    is_edited: false,
    created_at: new Date().toISOString(),
    parent_id: parentId,
    reply_to_comment_id: replyToCommentId,
    author: {
      id: currentUser?.id!,
      username: currentUser?.username || "",
      nickname: currentUser?.nickname || currentUser?.username || "사용자",
      profileImage: currentUser?.profileImage,
    },
    like_count: 0,
    is_liked: false,
  };

  // 1) 댓글 목록(SWRInfinite pages 배열)에서 부모 댓글 reply_count +1
  mutateComments((pages: any[] | undefined) => {
    if (!Array.isArray(pages)) return pages as any;
    return pages.map((page: any) => {
      if (!page?.data) return page;
      const nextData = (page.data as any[]).map((c: any) =>
        c?.id === parentId ? { ...c, reply_count: (c.reply_count || 0) + 1 } : c
      );
      return { ...page, data: nextData };
    });
  }, false);

  // 2) 대댓글 목록(SWRInfinite pages 배열) 첫 페이지에 낙관적 reply 추가
  mutateReplies((pages: any[] | undefined) => {
    if (!Array.isArray(pages) || pages.length === 0) return pages as any;
    const first = pages[0] || {};
    const firstData = Array.isArray(first.data) ? first.data : [];
    const newFirst = {
      ...first,
      data: [...firstData, optimisticReply],
      pagination: first.pagination
        ? { ...first.pagination, total: (first.pagination.total || 0) + 1 }
        : first.pagination,
    };
    return [newFirst, ...pages.slice(1)];
  }, false);

  return optimisticReply;
};

// ===== 낙관적 대댓글 업데이트 롤백 =====
export const rollbackOptimisticReply = async (
  parentId: string,
  postId: string,
  mutateComments: (updater: any, options?: any) => void,
  mutateReplies: (updater: any, options?: any) => void
) => {
  // 1) 댓글 목록(SWRInfinite pages 배열)에서 부모 댓글 reply_count -1
  mutateComments((pages: any[] | undefined) => {
    if (!Array.isArray(pages)) return pages as any;
    return pages.map((page: any) => {
      if (!page?.data) return page;
      const nextData = (page.data as any[]).map((c: any) => {
        if (c?.id !== parentId) return c;
        const nextCount = Math.max((c.reply_count || 0) - 1, 0);
        return { ...c, reply_count: nextCount };
      });
      return { ...page, data: nextData };
    });
  }, false);

  // 2) 대댓글 목록(SWRInfinite pages 배열) 첫 페이지에서 temp_reply_ 제거 및 total -1
  mutateReplies((pages: any[] | undefined) => {
    if (!Array.isArray(pages) || pages.length === 0) return pages as any;
    const first = pages[0] || {};
    const firstData = Array.isArray(first.data) ? first.data : [];
    const filtered = firstData.filter(
      (r: any) => !String(r?.id).startsWith("temp_reply_")
    );
    const newFirst = {
      ...first,
      data: filtered,
      pagination: first.pagination
        ? {
            ...first.pagination,
            total: Math.max((first.pagination.total || 0) - 1, 0),
          }
        : first.pagination,
    };
    return [newFirst, ...pages.slice(1)];
  }, false);
};
