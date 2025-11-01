"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  MessageCircle,
  UserPlus,
  FilePlus2,
  AtSign,
  Heart,
} from "lucide-react";
import UserAvatar from "@/app/components/common/UserAvatar";
import UserNickName from "@/app/components/common/UserNickName";
import ContentWithMentions from "@/app/components/common/ContentWithMentions";
import { expressApi } from "@/lib/api/config";
import type { NotificationDto } from "@/lib/api/notifications";

interface NotificationItemProps {
  n: NotificationDto;
  onOpenPostModalById: (
    postId: string,
    highlightCommentId?: string
  ) => void | Promise<void>;
  markRead: (notificationId: string) => void | Promise<void>;
}

export default function NotificationItem({
  n,
  onOpenPostModalById,
  markRead,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = async () => {
    try {
      if (n.type === "follow") {
        // 팔로우: 프로필 이동
        try {
          const res = await expressApi.get(`/users/${n.from_user_id}/basic`);
          const username = res.data?.data?.username;
          if (username) router.push(`/profile/${username}`);
        } catch {}
      } else if (
        n.type === "post_liked" ||
        n.type === "post_commented" ||
        n.type === "mention_comment" ||
        n.type === "comment_liked"
      ) {
        // post_commented, mention_comment, comment_liked의 경우 target_id가 댓글 ID
        // 댓글을 조회해서 post_id를 가져와야 함
        if (
          n.type === "post_commented" ||
          n.type === "mention_comment" ||
          n.type === "comment_liked"
        ) {
          try {
            const res = await expressApi.get(`/comments/${n.target_id}/basic`);
            const postId = res.data?.data?.post_id;
            if (postId) {
              // 댓글 ID를 highlightCommentId로 전달하여 해당 댓글 강조
              await onOpenPostModalById(postId, n.target_id);
            } else {
              alert("삭제된 게시물입니다.");
            }
          } catch (err) {
            // openPostModalById에서 이미 에러 처리를 하므로 여기서는 추가 처리 없음
            console.error("댓글 조회 실패:", err);
          }
        } else if (n.type === "post_liked") {
          // post_liked의 경우 target_id가 게시글 ID
          await onOpenPostModalById(n.target_id);
        }
      }
    } finally {
      markRead(n.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        !n.is_read ? "bg-blue-50 dark:bg-blue-900/10" : ""
      }`}
    >
      <div className="flex items-center justify-center space-x-3">
        <div className="mt-0.5">
          {n.type === "mention_comment" ? (
            <AtSign className="text-blue-500" size={18} />
          ) : n.type === "post_commented" ? (
            <MessageCircle className="text-blue-500" size={18} />
          ) : n.type === "post_liked" ? (
            <Heart className="text-red-500" size={18} />
          ) : n.type === "comment_liked" ? (
            <Heart className="text-red-500" size={18} />
          ) : n.type === "followee_post" ? (
            <FilePlus2 className="text-green-600" size={18} />
          ) : n.type === "follow" ? (
            <UserPlus className="text-purple-500" size={18} />
          ) : (
            <Bell className="text-gray-500" size={18} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {n.from_user && (
              <UserAvatar
                src={n.from_user.profile_image || undefined}
                nameForInitial={n.from_user.nickname || n.from_user.username}
                size={28}
                profileUsername={n.from_user.username}
              />
            )}
            {n.from_user && (
              <UserNickName
                username={n.from_user.username}
                name={n.from_user.nickname || n.from_user.username}
                className="font-medium"
                as="span"
              />
            )}
            <span className="text-gray-900 dark:text-white text-sm">
              {n.type === "mention_comment"
                ? "님이 회원님을 멘션했습니다."
                : n.type === "post_commented"
                ? "님이 회원님의 게시글에 댓글을 남겼습니다."
                : n.type === "post_liked"
                ? "님이 회원님의 게시글을 좋아합니다."
                : n.type === "comment_liked"
                ? "님이 회원님의 댓글을 좋아합니다."
                : n.type === "followee_post"
                ? "님이 새 게시글을 올렸습니다."
                : n.type === "follow"
                ? "님이 회원님을 팔로우하기 시작했습니다."
                : n.type}
            </span>
          </div>

          {/* 타겟 미리보기 */}
          {(n.post || n.comment) && (
            <div className="mt-2 flex items-start gap-3">
              {n.post?.thumbnail_url && (
                <img
                  src={n.post.thumbnail_url}
                  alt="thumbnail"
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0 text-sm text-gray-700 dark:text-gray-300">
                {n.comment ? (
                  <ContentWithMentions
                    text={n.comment.content || ""}
                    insideButton
                  />
                ) : (
                  <ContentWithMentions
                    text={n.post?.content || ""}
                    insideButton
                  />
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(n.created_at).toLocaleString()}
          </p>
        </div>
        {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
      </div>
    </button>
  );
}
