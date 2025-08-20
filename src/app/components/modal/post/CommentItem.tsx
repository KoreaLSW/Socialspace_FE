"use client";

import { Comment } from "@/types/post";
import UserAvatar from "../../common/UserAvatar";
import UserNickName from "../../common/UserNickName";
import CommentLikeButton from "../../common/CommentLikeButton";
import ContentWithMentions from "../../common/ContentWithMentions";
import { useState } from "react";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isExpanded: boolean;
  onToggleExpanded: (commentId: string) => void;
  onProfileClick: (username: string | undefined) => void;
  onLike: (commentId: string, isLiked: boolean) => void | Promise<void>;
  isPostAuthor?: boolean;
  onReply?: (comment: Comment) => void;
  canEdit?: boolean;
  onEdit?: (commentId: string, content: string) => Promise<void> | void;
  onDelete?: (commentId: string) => Promise<void> | void;
}

export default function CommentItem({
  comment,
  postId,
  isExpanded,
  onToggleExpanded,
  onProfileClick,
  onLike,
  isPostAuthor = false,
  onReply,
  canEdit = false,
  onEdit,
  onDelete,
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

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);

  const submitEdit = async () => {
    if (!onEdit || !editing) return;
    const trimmed = editContent.trim();
    if (!trimmed) return;
    try {
      setSubmitting(true);
      await onEdit(comment.id, trimmed);
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = confirm("해당 댓글을 삭제할까요?");
    if (!ok) return;
    await onDelete(comment.id);
  };

  return (
    <div className="space-y-2" id={`comment-${comment.id}`}>
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
            {isPostAuthor && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (작성자)
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeAgo(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (수정됨)
              </span>
            )}
          </div>

          <div className="mt-1">
            {editing ? (
              <div className="space-y-2">
                <textarea
                  className="w-full text-sm bg-transparent border rounded-md px-2 py-1 dark:border-gray-600"
                  rows={3}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={submitting}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={submitEdit}
                    className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={submitting}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditContent(comment.content);
                    }}
                    className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
                    disabled={submitting}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <ContentWithMentions
                text={comment.content}
                className={`text-gray-900 dark:text-white text-sm whitespace-pre-wrap ${
                  !isExpanded ? "line-clamp-3" : ""
                }`}
              />
            )}

            {(comment.content.split("\n").length > 3 ||
              comment.content.length > 150) &&
              !editing && (
                <button
                  onClick={() => onToggleExpanded(comment.id)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-1 transition-colors"
                >
                  {isExpanded ? "접기" : "더 보기"}
                </button>
              )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <CommentLikeButton
              postId={postId}
              commentId={comment.id}
              isLiked={comment.is_liked || false}
              count={comment.like_count || 0}
            />
            {onReply && !editing && (
              <button
                onClick={() => onReply(comment)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                답글 달기
              </button>
            )}
            {canEdit && !editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
