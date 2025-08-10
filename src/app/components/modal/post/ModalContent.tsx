"use client";

import { MessageCircle, Share, Bookmark } from "lucide-react";
import { ApiPost, Comment } from "@/types/post";
import LikeButton from "../../common/LikeButton";
import { useComments } from "@/hooks/useComments";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import * as commentsApi from "@/lib/api/comments";
import { SWRInfiniteKeyedMutator } from "swr/infinite";
import { InfinitePostsMutateFunction } from "@/hooks/usePosts";
import CommentItem from "./CommentItem";

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
}

export default function ModalContent({
  post,
  user,
  mutatePosts,
  mutateUserPosts,
}: ModalContentProps) {
  const router = useRouter();
  const {
    comments,
    isLoading: commentsLoading,
    isLoadingMore,
    size,
    setSize,
    hasMore,
    total,
  } = useComments(post.id);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
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

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* 게시물 텍스트 */}
      <div className="mb-4">
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">
          {post.content}
        </p>
      </div>

      {/* 해시태그 표시 */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="mb-4">
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
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
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

      {/* 상호작용 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <LikeButton
            postId={post.id}
            initialLiked={post.is_liked || false}
            initialCount={post.like_count || 0}
            size={24}
            mutatePosts={mutatePosts}
            mutateUserPosts={mutateUserPosts}
          />
          <button className="text-gray-500 hover:text-gray-700 transition-colors">
            <MessageCircle size={24} />
          </button>
          <button className="text-gray-500 hover:text-gray-700 transition-colors">
            <Share size={24} />
          </button>
        </div>
        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          <Bookmark size={24} />
        </button>
      </div>

      {/* 댓글 섹션 */}
      <div className="space-y-3">
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
            {comments.map((comment: Comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isExpanded={expandedComments.has(comment.id)}
                onToggleExpanded={toggleCommentExpanded}
                onProfileClick={handleProfileClick}
                onLike={handleCommentLike}
              />
            ))}
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
  );
}
