"use client";

import { Comment } from "@/types/post";
import UserAvatar from "../../common/UserAvatar";
import UserNickName from "../../common/UserNickName";
import CommentLikeButton from "../../common/CommentLikeButton";
import ContentWithMentions from "../../common/ContentWithMentions";

interface CommentItemProps {
  comment: Comment;
  isExpanded: boolean;
  onToggleExpanded: (commentId: string) => void;
  onProfileClick: (username: string | undefined) => void;
  onLike: (commentId: string, isLiked: boolean) => void | Promise<void>;
}

export default function CommentItem({
  comment,
  isExpanded,
  onToggleExpanded,
  onProfileClick,
  onLike,
}: CommentItemProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

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

    return koreaDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        <UserAvatar
          src={comment.author?.profileImage}
          alt={comment.author?.nickname}
          nameForInitial={comment.author?.nickname || comment.author?.username}
          size={32}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          profileUsername={comment.author?.username}
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <UserNickName
              username={comment.author?.username}
              name={comment.author?.nickname}
              className="font-medium text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            />
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
            <ContentWithMentions
              text={comment.content}
              className={`text-gray-900 dark:text-white text-sm whitespace-pre-wrap ${
                !isExpanded ? "line-clamp-3" : ""
              }`}
            />
            {(comment.content.split("\n").length > 3 ||
              comment.content.length > 150) && (
              <button
                onClick={() => onToggleExpanded(comment.id)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-1 transition-colors"
              >
                {isExpanded ? "접기" : "더 보기"}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <CommentLikeButton
              postId={(comment as any).post_id || (comment as any).postId}
              commentId={comment.id}
              isLiked={comment.is_liked || false}
              count={comment.like_count || 0}
            />
            <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              답글
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
