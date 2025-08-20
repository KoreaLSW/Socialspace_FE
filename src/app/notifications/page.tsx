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
import NotificationItem from "../components/notifications/NotificationItem";
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
              <NotificationItem
                key={n.id}
                n={n as any}
                onOpenPostModalById={openPostModalById}
                markRead={markRead}
              />
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
