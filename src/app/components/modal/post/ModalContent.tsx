"use client";

import {
  MessageCircle,
  Share,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ApiPost, Comment } from "@/types/post";
import LikeButton from "../../common/LikeButton";
import { useComments } from "@/hooks/useComments";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { SWRInfiniteKeyedMutator } from "swr/infinite";
import { InfinitePostsMutateFunction } from "@/hooks/usePosts";
import CommentItem from "./CommentItem";
import RepliesBlock from "./RepliesBlock";
import * as commentsApi from "@/lib/api/comments";
import ModalCommentInput from "./ModalCommentInput";

interface User {
  id?: string;
  email?: string;
  username?: string;
  nickname?: string;
  profileImage?: string;
}

interface ModalContentProps {
  post: ApiPost;
  user: User | null;
  mutatePosts?: InfinitePostsMutateFunction;
  mutateUserPosts?: SWRInfiniteKeyedMutator<any>;
  pinnedComment?: Comment | null;
  replyContext?: {
    parentId?: string;
    replyToCommentId?: string;
    mentionUsername?: string;
  } | null;
  setReplyContext?: (
    context: {
      parentId?: string;
      replyToCommentId?: string;
      mentionUsername?: string;
    } | null
  ) => void;
  currentUserId?: string;
  onLikeChange?: (postId: string, isLiked: boolean, newCount: number) => void;
}

export default function ModalContent({
  post,
  user,
  mutatePosts,
  mutateUserPosts,
  pinnedComment,
  replyContext,
  setReplyContext,
  currentUserId,
  onLikeChange,
}: ModalContentProps) {
  const highlightCommentId = (post as any).highlightCommentId as
    | string
    | undefined;
  const router = useRouter();
  const {
    comments,
    isLoading: commentsLoading,
    isLoadingMore,
    size,
    setSize,
    hasMore,
    total,
    mutateComments,
  } = useComments(post.id);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 게시물 내용의 줄 수를 체크하여 접기/펼치기 버튼 표시 여부 결정
  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * 3; // 3줄로 제한

      if (element.scrollHeight > maxHeight) {
        setShouldShowToggle(true);
      } else {
        setShouldShowToggle(false);
        setIsContentExpanded(false); // 토글이 필요 없으면 항상 펼쳐진 상태
      }
    }
  }, [post.content]);

  // pinnedComment는 부모에서 전달되어 동시 렌더 보장
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // 한국시간으로 변환 (UTC+9)
    const koreaDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const koreaNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

    const diffInMinutes = Math.floor(
      (koreaNow.getTime() - koreaDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    // 일주일 이상은 날짜 표시 (한국시간 기준)
    return koreaDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const toggleCommentExpanded = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  // 프로필 이동 함수
  const handleProfileClick = (username: string | undefined) => {
    console.log("username>>>", username);
    if (username) {
      router.push(`/profile/${username}`);
    }
  };

  // 댓글 좋아요 핸들러
  const handleCommentLike = async (commentId: string, isLiked: boolean) => {
    try {
      // 낙관적 업데이트: 댓글 목록에서 해당 댓글의 좋아요 상태 즉시 업데이트
      mutate(
        `/comments/post/${post.id}`,
        (currentData: any) => {
          if (!currentData?.data) return currentData;

          const updatedComments = currentData.data.map((comment: Comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                is_liked: !isLiked,
                like_count: isLiked
                  ? Math.max(0, (comment.like_count || 0) - 1)
                  : (comment.like_count || 0) + 1,
              };
            }
            return comment;
          });

          return { ...currentData, data: updatedComments };
        },
        { revalidate: false }
      );

      // 서버에 요청
      if (isLiked) {
        await commentsApi.unlikeComment(commentId);
      } else {
        await commentsApi.likeComment(commentId);
      }
    } catch (error) {
      console.error("댓글 좋아요 처리 실패:", error);

      // 에러 시 롤백
      mutate(`/comments/post/${post.id}`);
    }
  };

  const handleReplyClick = (target: Comment) => {
    const parentId = (target as any).parent_id || target.id;
    const replyToCommentId = target.id;
    const mentionUsername = target.author?.username;
    setReplyContext?.({ parentId, replyToCommentId, mentionUsername });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 모바일: 전체 스크롤, 데스크톱: 게시물 내용 고정 */}
      <div className="flex-1 lg:flex-0 overflow-y-auto lg:overflow-y-visible content-scroll">
        <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-700 lg:border-b">
          {/* 게시물 텍스트 */}
          <div className="mb-3">
            <div
              ref={contentRef}
              className={`text-gray-900 dark:text-white whitespace-pre-wrap text-sm transition-all duration-200 ${
                shouldShowToggle && !isContentExpanded
                  ? "lg:max-h-[4.5rem] lg:overflow-hidden"
                  : shouldShowToggle && isContentExpanded
                  ? "lg:max-h-[150px] lg:sm:max-h-[200px] lg:overflow-y-auto lg:content-scroll"
                  : ""
              }`}
            >
              {post.content}
            </div>

            {/* 더 보기/접기 버튼 - 데스크톱에서만 표시 */}
            {shouldShowToggle && (
              <button
                onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="hidden lg:flex items-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-xs mt-1 transition-colors"
              >
                {isContentExpanded ? (
                  <>
                    <span>접기</span>
                    <ChevronUp size={14} className="ml-1" />
                  </>
                ) : (
                  <>
                    <span>더 보기</span>
                    <ChevronDown size={14} className="ml-1" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* 해시태그 표시 */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {post.hashtags.map((hashtag) => (
                  <span
                    key={hashtag.id}
                    className="text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                  >
                    #{hashtag.tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 게시물 메타 정보 */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {new Date(
              new Date(post.created_at).getTime() + 9 * 60 * 60 * 1000
            ).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          {/* 상호작용 버튼 - 모바일에서만 표시 */}
          <div className="lg:hidden flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <LikeButton
                postId={post.id}
                initialLiked={post.is_liked || false}
                initialCount={post.like_count || 0}
                size={20}
                mutatePosts={mutatePosts}
                mutateUserPosts={mutateUserPosts}
                hideCount={post.hide_likes === true}
                onLikeChange={onLikeChange}
              />
              <button
                className={`transition-colors ${
                  post.allow_comments === false
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                disabled={post.allow_comments === false}
              >
                <MessageCircle size={20} className="sm:w-6 sm:h-6" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <Share size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <Bookmark size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* 댓글 섹션 - 모바일에서는 위와 함께 스크롤 */}
        <div className="lg:hidden">
          <div className="p-3 sm:p-4 space-y-3">
            {/* 댓글 개수 표시 */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                댓글 {total}개
              </h3>
            </div>

            {commentsLoading && comments.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                댓글을 불러오는 중...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                댓글이 없습니다.
              </div>
            ) : (
              <>
                {(() => {
                  const ordered = pinnedComment
                    ? [
                        pinnedComment,
                        ...comments.filter((c) => c.id !== pinnedComment.id),
                      ]
                    : comments;
                  return ordered.map((comment: Comment) => {
                    const isHighlighted =
                      (highlightCommentId &&
                        comment.id === highlightCommentId) ||
                      (!!pinnedComment && comment.id === pinnedComment.id);
                    const isPostAuthor =
                      !!post.author?.id &&
                      comment.author?.id === post.author?.id;
                    const node = (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={post.id}
                        isExpanded={expandedComments.has(comment.id)}
                        onToggleExpanded={toggleCommentExpanded}
                        onProfileClick={handleProfileClick}
                        onLike={handleCommentLike}
                        isPostAuthor={isPostAuthor}
                        onReply={handleReplyClick}
                        canEdit={comment.author?.id === currentUserId}
                        onEdit={async (commentId: string, content: string) => {
                          try {
                            // 댓글 리스트 낙관적 수정
                            await mutateComments((pages: any[] | undefined) => {
                              if (!Array.isArray(pages)) return pages as any;
                              return pages.map((page: any) => {
                                if (!page?.data) return page;
                                const next = (page.data as any[]).map(
                                  (c: any) =>
                                    c?.id === commentId
                                      ? { ...c, content, is_edited: true }
                                      : c
                                );
                                return { ...page, data: next };
                              });
                            }, false);
                            await commentsApi.updateComment(commentId, content);
                            alert("댓글이 수정되었습니다.");
                            await mutateComments();
                          } catch (e) {
                            await mutateComments();
                          }
                        }}
                        onDelete={async (commentId: string) => {
                          try {
                            // 댓글 리스트 낙관적 삭제
                            await mutateComments((pages: any[] | undefined) => {
                              if (!Array.isArray(pages)) return pages as any;
                              return pages.map((page: any) => {
                                if (!page?.data) return page;
                                const filtered = (page.data as any[]).filter(
                                  (c: any) => c?.id !== commentId
                                );
                                return { ...page, data: filtered };
                              });
                            }, false);
                            await commentsApi.deleteComment(commentId);
                            alert("댓글이 삭제되었습니다.");
                            await mutateComments();
                          } catch (e) {
                            await mutateComments();
                          }
                        }}
                      />
                    );
                    if (isHighlighted) {
                      return (
                        <div
                          key={`hl-${comment.id}`}
                          className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20"
                        >
                          {node}
                        </div>
                      );
                    }
                    return (
                      <div key={`wrap-${comment.id}`}>
                        {node}
                        <RepliesBlock
                          parent={comment}
                          expanded={expandedComments.has(comment.id)}
                          onToggle={() => toggleCommentExpanded(comment.id)}
                          onReply={handleReplyClick}
                          currentUserId={currentUserId}
                          mutateComments={mutateComments}
                          postId={post.id}
                        />
                      </div>
                    );
                  });
                })()}
                <div className="pt-2">
                  {hasMore || isLoadingMore ? (
                    <button
                      onClick={() => setSize(size + 1)}
                      className="w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 py-2"
                      disabled={isLoadingMore}
                      aria-busy={isLoadingMore}
                    >
                      {isLoadingMore ? "불러오는 중..." : "댓글 더 보기"}
                    </button>
                  ) : (
                    <div className="w-full text-center text-xs text-gray-400 dark:text-gray-500 py-2 select-none">
                      모든 댓글을 불러왔습니다
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 데스크톱 전용 상호작용 + 댓글 섹션 - 함께 애니메이션 */}
      <div className="hidden lg:flex lg:flex-1 lg:overflow-y-auto lg:min-h-0 lg:flex-col">
        {/* 상호작용 버튼 + 댓글 섹션 - 공백 없이 연결 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 space-y-3">
            {/* 상호작용 버튼 - 댓글과 바로 연결 */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <LikeButton
                  postId={post.id}
                  initialLiked={post.is_liked || false}
                  initialCount={post.like_count || 0}
                  size={20}
                  mutatePosts={mutatePosts}
                  mutateUserPosts={mutateUserPosts}
                  hideCount={post.hide_likes === true}
                  onLikeChange={onLikeChange}
                />
                <button
                  className={`transition-colors ${
                    post.allow_comments === false
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  disabled={post.allow_comments === false}
                >
                  <MessageCircle size={20} className="sm:w-6 sm:h-6" />
                </button>
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  <Share size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <Bookmark size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            {/* 댓글 개수 표시 */}
            <div className="flex items-center justify-between py-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                댓글 {total}개
              </h3>
            </div>

            {commentsLoading && comments.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                댓글을 불러오는 중...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                댓글이 없습니다.
              </div>
            ) : (
              <>
                {(() => {
                  const ordered = pinnedComment
                    ? [
                        pinnedComment,
                        ...comments.filter((c) => c.id !== pinnedComment.id),
                      ]
                    : comments;
                  return ordered.map((comment: Comment) => {
                    const isHighlighted =
                      (highlightCommentId &&
                        comment.id === highlightCommentId) ||
                      (!!pinnedComment && comment.id === pinnedComment.id);
                    const isPostAuthor =
                      !!post.author?.id &&
                      comment.author?.id === post.author?.id;
                    const node = (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={post.id}
                        isExpanded={expandedComments.has(comment.id)}
                        onToggleExpanded={toggleCommentExpanded}
                        onProfileClick={handleProfileClick}
                        onLike={handleCommentLike}
                        isPostAuthor={isPostAuthor}
                        onReply={handleReplyClick}
                        canEdit={comment.author?.id === currentUserId}
                        onEdit={async (commentId: string, content: string) => {
                          try {
                            // 댓글 리스트 낙관적 수정
                            await mutateComments((pages: any[] | undefined) => {
                              if (!Array.isArray(pages)) return pages as any;
                              return pages.map((page: any) => {
                                if (!page?.data) return page;
                                const next = (page.data as any[]).map(
                                  (c: any) =>
                                    c?.id === commentId
                                      ? { ...c, content, is_edited: true }
                                      : c
                                );
                                return { ...page, data: next };
                              });
                            }, false);
                            await commentsApi.updateComment(commentId, content);
                            alert("댓글이 수정되었습니다.");
                            await mutateComments();
                          } catch (e) {
                            await mutateComments();
                          }
                        }}
                        onDelete={async (commentId: string) => {
                          try {
                            // 댓글 리스트 낙관적 삭제
                            await mutateComments((pages: any[] | undefined) => {
                              if (!Array.isArray(pages)) return pages as any;
                              return pages.map((page: any) => {
                                if (!page?.data) return page;
                                const filtered = (page.data as any[]).filter(
                                  (c: any) => c?.id !== commentId
                                );
                                return { ...page, data: filtered };
                              });
                            }, false);
                            await commentsApi.deleteComment(commentId);
                            alert("댓글이 삭제되었습니다.");
                            await mutateComments();
                          } catch (e) {
                            await mutateComments();
                          }
                        }}
                      />
                    );
                    if (isHighlighted) {
                      return (
                        <div
                          key={`hl-${comment.id}`}
                          className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20"
                        >
                          {node}
                        </div>
                      );
                    }
                    return (
                      <div key={`wrap-${comment.id}`}>
                        {node}
                        <RepliesBlock
                          parent={comment}
                          expanded={expandedComments.has(comment.id)}
                          onToggle={() => toggleCommentExpanded(comment.id)}
                          onReply={handleReplyClick}
                          currentUserId={currentUserId}
                          mutateComments={mutateComments}
                          postId={post.id}
                        />
                      </div>
                    );
                  });
                })()}
                <div className="pt-2">
                  {hasMore || isLoadingMore ? (
                    <button
                      onClick={() => setSize(size + 1)}
                      className="w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 py-2"
                      disabled={isLoadingMore}
                      aria-busy={isLoadingMore}
                    >
                      {isLoadingMore ? "불러오는 중..." : "댓글 더 보기"}
                    </button>
                  ) : (
                    <div className="w-full text-center text-xs text-gray-400 dark:text-gray-500 py-2 select-none">
                      모든 댓글을 불러왔습니다
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
