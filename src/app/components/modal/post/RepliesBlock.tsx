"use client";

import { Comment } from "@/types/post";
import { useReplies } from "@/hooks/useReplies";
import CommentItem from "./CommentItem";
import { useCallback } from "react";
import * as commentsApi from "@/lib/api/comments";

interface RepliesBlockProps {
  parent: Comment;
  expanded: boolean;
  onToggle: () => void;
  onReply: (c: Comment) => void;
  currentUserId?: string;
  mutateComments: (updater?: any, revalidate?: boolean) => Promise<any>;
  postId: string;
}

export default function RepliesBlock({
  parent,
  expanded,
  onToggle,
  onReply,
  currentUserId,
  mutateComments,
  postId,
}: RepliesBlockProps) {
  const {
    replies,
    isLoading,
    isLoadingMore,
    replyHasMore,
    setReplySize,
    replyTotal,
    mutateReplies,
  } = useReplies(parent.id);
  const count = (parent as any).reply_count ?? replyTotal ?? 0;

  const handleLoadMoreReplies = useCallback(() => {
    if (replyHasMore && !isLoadingMore) {
      setReplySize((prev: number) => prev + 1);
    }
  }, [replyHasMore, isLoadingMore]);

  return (
    <div className="pl-10">
      <button
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mt-1"
        onClick={onToggle}
      >
        {expanded ? "답글 숨기기" : `답글 보기(${count}개)`}
      </button>
      {expanded && (
        <div className="mt-2 space-y-3">
          {isLoading ? (
            <div className="text-xs text-gray-400">불러오는 중...</div>
          ) : (
            <>
              {replies.map((reply: any) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  isExpanded={false}
                  onToggleExpanded={() => {}}
                  onProfileClick={() => {}}
                  onLike={() => {}}
                  isPostAuthor={reply.author?.id === parent.author?.id}
                  onReply={onReply}
                  canEdit={reply.author?.id === currentUserId}
                  onEdit={async (commentId: string, content: string) => {
                    try {
                      await mutateReplies((pages: any[] | undefined) => {
                        if (!Array.isArray(pages)) return pages as any;
                        return pages.map((page: any) => {
                          if (!page?.data) return page;
                          const next = (page.data as any[]).map((r: any) =>
                            r?.id === commentId
                              ? { ...r, content, is_edited: true }
                              : r
                          );
                          return { ...page, data: next };
                        });
                      }, false);
                      await commentsApi.updateComment(commentId, content);
                      await mutateReplies(undefined, true);
                      alert("답글이 수정되었습니다.");
                    } catch (e) {
                      await mutateReplies(undefined, true);
                    }
                  }}
                  onDelete={async (commentId: string) => {
                    try {
                      await mutateReplies((pages: any[] | undefined) => {
                        if (!Array.isArray(pages)) return pages as any;
                        return pages.map((page: any) => {
                          if (!page?.data) return page;
                          const filtered = (page.data as any[]).filter(
                            (r: any) => r?.id !== commentId
                          );
                          return { ...page, data: filtered };
                        });
                      }, false);
                      // 부모 reply_count -1
                      await mutateComments((pages: any[] | undefined) => {
                        if (!Array.isArray(pages)) return pages as any;
                        return pages.map((page: any) => {
                          if (!page?.data) return page;
                          const next = (page.data as any[]).map((c: any) => {
                            if (c?.id !== parent.id) return c;
                            const nextCount = Math.max(
                              (c.reply_count || 0) - 1,
                              0
                            );
                            return { ...c, reply_count: nextCount };
                          });
                          return { ...page, data: next };
                        });
                      }, false);
                      await commentsApi.deleteComment(commentId);
                      await mutateReplies(undefined, true);
                      await mutateComments();
                      alert("답글이 삭제되었습니다.");
                    } catch (e) {
                      await mutateReplies(undefined, true);
                      await mutateComments();
                    }
                  }}
                />
              ))}

              {replyHasMore && (
                <div className="pt-2">
                  <button
                    onClick={handleLoadMoreReplies}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 py-2"
                    disabled={isLoadingMore}
                    aria-busy={isLoadingMore}
                  >
                    {isLoadingMore ? "불러오는 중..." : "답글 더 보기"}
                  </button>
                </div>
              )}

              {!replyHasMore && replies.length > 0 && (
                <div className="w-full text-center text-xs text-gray-400 dark:text-gray-500 py-2 select-none">
                  모든 답글을 불러왔습니다
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
