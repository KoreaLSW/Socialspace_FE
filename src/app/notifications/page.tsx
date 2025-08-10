"use client";

import {
  Bell,
  MessageCircle,
  UserPlus,
  FilePlus2,
  AtSign,
  Heart,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationActions } from "@/hooks/useNotificationActions";
import { useEffect, useRef, useState } from "react";
import { expressApi } from "@/lib/api/config";
import { useRouter } from "next/navigation";
import UserAvatar from "@/app/components/common/UserAvatar";
import UserNickName from "@/app/components/common/UserNickName";
import ContentWithMentions from "@/app/components/common/ContentWithMentions";
import PostModal from "../components/modal/post/PostModal";
import { postsApi } from "@/lib/api/posts";
import { ApiPost } from "@/types/post";
import * as commentsApi from "@/lib/api/comments";

export default function NotificationsPage() {
  const { notifications, size, setSize, hasMore, isValidating } =
    useNotifications();
  const { markAllRead, markRead } = useNotificationActions();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [modalPost, setModalPost] = useState<ApiPost | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const openPostModalById = async (
    postId: string,
    highlightCommentId?: string
  ) => {
    try {
      const [postRes, commentRes] = await Promise.all([
        postsApi.getById(postId) as any,
        highlightCommentId
          ? (import("@/lib/api/comments").then((m) =>
              m.getCommentById(highlightCommentId!)
            ) as any)
          : Promise.resolve(null),
      ]);
      const post: ApiPost = (postRes?.data ?? postRes) as ApiPost;
      const highlightComment = commentRes
        ? (commentRes.data ?? commentRes)?.data ?? null
        : null;
      if (post && post.id) {
        const payload: any = { ...post };
        if (highlightCommentId) payload.highlightCommentId = highlightCommentId;
        if (highlightComment) payload.highlightComment = highlightComment;
        setModalPost(payload as ApiPost);
        setIsPostModalOpen(true);
      }
    } catch (e) {
      console.error("게시물 로드 실패", e);
    }
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !isValidating) {
        setSize(size + 1);
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isValidating, setSize, size]);

  return (
    <>
      {/* 알림 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            알림
          </h1>
          <button
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            onClick={() => markAllRead()}
          >
            모두 읽음
          </button>
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500 dark:text-gray-400">
              새로운 알림이 없습니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  // 상세 이동 로직
                  const go = async () => {
                    if (n.type === "follow") {
                      // from_user_id의 프로필로 이동
                      // 간단히 username 조회 API를 추가했으므로 client에서 /users/:id/basic 사용 가능
                      try {
                        const res = await expressApi.get(
                          `/users/${n.from_user_id}/basic`
                        );
                        const username = res.data?.data?.username;
                        if (username) router.push(`/profile/${username}`);
                      } catch {}
                    } else if (
                      n.type === "post_liked" ||
                      n.type === "post_commented" ||
                      n.type === "mention_comment" ||
                      n.type === "comment_liked"
                    ) {
                      // 댓글 멘션은 target_id가 댓글 ID, 댓글/포스트 좋아요는 target이 포스트/댓글이 섞임
                      // 우선 댓글 기반이면 댓글 기본정보로 post_id 조회
                      try {
                        // 댓글 기반 타입: mention_comment, comment_liked
                        if (
                          n.type === "mention_comment" ||
                          n.type === "comment_liked"
                        ) {
                          const res = await expressApi.get(
                            `/comments/${n.target_id}/basic`
                          );
                          const postId = res.data?.data?.post_id;
                          if (postId)
                            await openPostModalById(postId, n.target_id);
                        } else if (
                          n.type === "post_liked" ||
                          n.type === "post_commented"
                        ) {
                          // 포스트 기반
                          await openPostModalById(n.target_id);
                        }
                      } catch {}
                    } else if (n.type === "comment_liked") {
                      try {
                        const res = await expressApi.get(
                          `/comments/${n.target_id}/basic`
                        );
                        const postId = res.data?.data?.post_id;
                        if (postId)
                          await openPostModalById(postId, n.target_id);
                      } catch {}
                    }
                    markRead(n.id);
                  };
                  go();
                }}
                className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !n.is_read ? "bg-blue-50 dark:bg-blue-900/10" : ""
                }`}
              >
                <div className="flex items-start space-x-3">
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
                          nameForInitial={
                            n.from_user.nickname || n.from_user.username
                          }
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
                  {!n.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
            <div ref={sentinelRef} className="h-8" />
          </div>
        )}
      </div>

      {modalPost && (
        <PostModal
          post={modalPost}
          isOpen={isPostModalOpen}
          onClose={() => {
            setIsPostModalOpen(false);
            setModalPost(null);
          }}
        />
      )}
    </>
  );
}
