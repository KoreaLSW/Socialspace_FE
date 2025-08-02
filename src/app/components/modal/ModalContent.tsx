"use client";

import { MessageCircle, Share, Bookmark, Heart } from "lucide-react";
import { ApiPost, Comment } from "@/types/post";
import LikeButton from "../home/LikeButton";
import { useComments } from "@/hooks/useComments";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";

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
}

export default function ModalContent({ post, user }: ModalContentProps) {
  const router = useRouter();
  const { comments, isLoading: commentsLoading } = useComments(post.id);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  console.log("comments>>>", comments);
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

  // 좋아요 상태 변경 핸들러
  const handleLikeChange = (
    postId: string,
    isLiked: boolean,
    newCount: number
  ) => {
    // 모든 게시물 목록에서 해당 게시물 업데이트
    mutate(
      (key) =>
        typeof key === "string" &&
        (key.includes("/posts") || key.startsWith("/posts")),
      (currentData: any) => {
        if (!currentData?.data) return currentData;

        // 게시물 목록인 경우
        if (Array.isArray(currentData.data)) {
          const updatedPosts = currentData.data.map((p: any) => {
            if (p.id === postId) {
              return {
                ...p,
                is_liked: isLiked,
                like_count: newCount,
                isLiked: isLiked, // PostItem에서 사용하는 필드
                likes: newCount, // PostItem에서 사용하는 필드
              };
            }
            return p;
          });

          return { ...currentData, data: updatedPosts };
        }

        // 단일 게시물인 경우
        if (currentData.data.id === postId) {
          return {
            ...currentData,
            data: {
              ...currentData.data,
              is_liked: isLiked,
              like_count: newCount,
              isLiked: isLiked,
              likes: newCount,
            },
          };
        }

        return currentData;
      },
      { revalidate: false }
    );
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
            onLikeChange={handleLikeChange}
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
        {commentsLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            댓글을 불러오는 중...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            댓글이 없습니다.
          </div>
        ) : (
          comments.map((comment: Comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => handleProfileClick(comment.author?.username)}
                  className="hover:opacity-80 transition-opacity"
                >
                  <img
                    src={comment.author?.profileImage || "/default-avatar.png"}
                    alt={comment.author?.nickname}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleProfileClick(comment.author?.username)
                      }
                      className="font-medium text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {comment.author?.nickname}
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                    {comment.is_edited && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (편집됨)
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <p
                      className={`text-gray-900 dark:text-white text-sm whitespace-pre-wrap ${
                        !expandedComments.has(comment.id) ? "line-clamp-3" : ""
                      }`}
                    >
                      {comment.content}
                    </p>
                    {/* 댓글 내용이 3줄 이상이거나 150자 이상일 때 더보기 버튼 표시 */}
                    {(comment.content.split("\n").length > 3 ||
                      comment.content.length > 150) && (
                      <button
                        onClick={() => toggleCommentExpanded(comment.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-1 transition-colors"
                      >
                        {expandedComments.has(comment.id) ? "접기" : "더 보기"}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                      <Heart
                        size={14}
                        className={
                          comment.is_liked ? "fill-red-500 text-red-500" : ""
                        }
                      />
                      <span className="text-xs">{comment.like_count || 0}</span>
                    </button>
                    <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                      답글
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
