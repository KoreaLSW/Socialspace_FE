"use client";

import { Post, Comment as CommentType, ApiPost } from "@/types/post";
import { MessageCircle as Comment, Share, Hash } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LikeButton from "../common/LikeButton";
import ImageSlider from "../common/ImageSlider";
import PostModal from "../modal/post/PostModal";
import { useComments } from "@/hooks/useComments";
import { usePost } from "@/hooks/usePosts";
import UserAvatar from "../common/UserAvatar";
import UserNickName from "../common/UserNickName";
import ContentWithMentions from "../common/ContentWithMentions";
import ViewCount from "../common/ViewCount";

interface PostItemProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  mutatePosts?: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
}

export default function PostItem({
  post,
  onLike,
  onComment,
  onShare,
  onHashtagClick,
  mutatePosts,
}: PostItemProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [firstComment, setFirstComment] = useState<CommentType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFirstCommentExpanded, setIsFirstCommentExpanded] = useState(false);
  const [viewCount, setViewCount] = useState<number | undefined>(
    post.viewCount
  );
  const textRef = useRef<HTMLParagraphElement>(null);

  // 실제 댓글 데이터 가져오기
  const { comments, total } = useComments(post.id);
  const actualCommentCount = total;

  // 단건 게시글 SWR 구독 후 최신 데이터 병합 (낙관적 업데이트 반영)
  const { post: livePost } = usePost(post.id);
  const p: Post = {
    ...post,
    content: (livePost as any)?.content ?? post.content,
    isEdited: (livePost as any)?.is_edited ?? post.isEdited,
    updatedAt: (livePost as any)?.updated_at ?? post.updatedAt,
    allowComments: (livePost as any)?.allow_comments ?? post.allowComments,
    hideLikes: (livePost as any)?.hide_likes ?? post.hideLikes,
    hideViews: (livePost as any)?.hide_views ?? post.hideViews,
    visibility: (livePost as any)?.visibility ?? (post as any).visibility,
    image: (livePost as any)?.images?.length
      ? (livePost as any).images.map((i: any) => i.image_url)
      : post.image,
    hashtags: (livePost as any)?.hashtags?.length
      ? (livePost as any).hashtags.map((h: any) => h.tag)
      : post.hashtags,
    isLiked: (livePost as any)?.is_liked ?? post.isLiked,
    likes: (livePost as any)?.like_count ?? post.likes,
    viewCount: (livePost as any)?.view_count ?? post.viewCount,
    comments: (livePost as any)?.comment_count ?? post.comments,
  };

  // 이미지 배열 처리 (최신 데이터 기준)
  const images = Array.isArray(p.image) ? p.image : p.image ? [p.image] : [];

  // 텍스트가 3줄을 넘어가는지 확인
  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * 3; // 3줄 높이
      setShowMoreButton(element.scrollHeight > maxHeight);
    }
  }, [p.content]);

  // 첫 번째 댓글 로드 (실제 데이터)
  useEffect(() => {
    if (comments.length > 0) {
      setFirstComment(comments[0]);
    } else {
      setFirstComment(null);
    }
  }, [comments]);

  // 댓글 모달 열기
  const handleOpenCommentsModal = () => {
    setIsCommentsModalOpen(true);
    onComment?.(post.id);
  };

  // 이미지만 클릭했을 때 (댓글 입력 없이)
  const handleImageClick = () => {
    setIsCommentsModalOpen(true);
    onComment?.(post.id);
  };

  // 시간 포맷팅 (한국시간 기준)
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

  // 프로필 이동 함수
  const handleProfileClick = (username: string | undefined) => {
    if (username) {
      router.push(`/profile/${username}`);
    }
  };

  // 첫 번째 댓글 더보기 토글 함수
  const toggleFirstCommentExpanded = () => {
    setIsFirstCommentExpanded(!isFirstCommentExpanded);
  };

  // Post 타입을 ApiPost 타입으로 변환
  const convertToApiPost = (post: Post): ApiPost => {
    return {
      id: post.id,
      content: post.content,
      images:
        images.length > 0
          ? images.map((img, index) => ({
              id: `${post.id}_img_${index}`,
              image_url: img,
            }))
          : undefined,
      hashtags: post.hashtags?.map((tag, index) => ({
        id: `${post.id}_tag_${index}`,
        tag: tag,
      })),
      created_at: new Date().toISOString(), // 실제로는 post.time을 적절히 변환해야 함
      visibility: (post as any).visibility || "public",
      like_count: post.likes ?? 0,
      comment_count: actualCommentCount,
      is_liked: post.isLiked ?? false,
      allow_comments: post.allowComments, // 댓글 허용 여부 추가
      hide_views: post.hideViews, // 조회수 숨김 여부 추가
      hide_likes: post.hideLikes, // 좋아요 숨김 여부 추가
      author: {
        id: post.id, // 실제로는 author id가 따로 있어야 함
        username: post.username,
        nickname: post.nickname,
        profileImage: post.avatar,
      },
    };
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 포스트 헤더 */}
      <div className="p-4 flex items-center space-x-3">
        <UserAvatar
          src={post.avatar}
          alt={post.username}
          size={40}
          profileUsername={post.username}
          className="hover:opacity-80 transition-opacity"
        />
        <div className="flex-1">
          <UserNickName
            username={post.username}
            name={post.nickname}
            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {p.isEdited && p.updatedAt ? p.updatedAt : post.time}
            {p.isEdited ? " (수정됨)" : ""}
          </p>
        </div>
      </div>

      {/* 포스트 내용 */}
      <div className="px-4 pb-3">
        <div className="relative">
          <p
            ref={textRef}
            className={`text-gray-900 dark:text-white whitespace-pre-wrap ${
              !isExpanded ? "overflow-hidden" : ""
            }`}
            style={{
              display: !isExpanded ? "-webkit-box" : "block",
              WebkitLineClamp: !isExpanded ? 3 : "none",
              WebkitBoxOrient: !isExpanded ? "vertical" : "horizontal",
            }}
          >
            {p.content}
          </p>

          {/* 더보기 버튼 */}
          {showMoreButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
            >
              {isExpanded ? "접기" : "더보기"}
            </button>
          )}
        </div>

        {/* 해시태그 */}
        {p.hashtags && p.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {p.hashtags.map((hashtag, index) => (
              <button
                key={index}
                onClick={() => onHashtagClick?.(hashtag)}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                <Hash size={14} className="mr-1" />
                {hashtag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 포스트 이미지 */}
      {images.length > 0 && (
        <div className="px-4 pb-3">
          <div onClick={handleImageClick} className="cursor-pointer">
            <ImageSlider
              images={images}
              className="rounded-lg"
              imageClassName="max-h-96"
              resetKey={post.id}
              onImageChange={setCurrentImageIndex}
            />
          </div>
        </div>
      )}

      {/* 포스트 액션 */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <LikeButton
              postId={post.id}
              initialLiked={p.isLiked ?? false}
              initialCount={p.likes ?? 0}
              mutatePosts={mutatePosts}
              hideCount={p.hideLikes === true}
            />
            <button
              className={`flex items-center space-x-2 transition-colors ${
                p.allowComments === false
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:text-blue-500"
              }`}
              onClick={handleOpenCommentsModal}
              disabled={p.allowComments === false}
            >
              <Comment size={20} />
              <span>{actualCommentCount}</span>
            </button>
            <button
              className="text-gray-500 hover:text-green-500 transition-colors"
              onClick={() => onShare?.(post.id)}
            >
              <Share size={20} />
            </button>
          </div>
          {p.hideViews !== true && typeof viewCount === "number" && (
            <ViewCount count={viewCount} className="text-xs" />
          )}
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="px-4 pb-3">
        {actualCommentCount === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            댓글 없음
          </div>
        ) : (
          <div className="space-y-2">
            {/* 첫 번째 댓글 표시 */}
            {firstComment && (
              <div className="flex items-start space-x-2">
                <UserAvatar
                  src={firstComment.author?.profileImage}
                  alt={firstComment.author?.nickname}
                  nameForInitial={
                    firstComment.author?.nickname ||
                    firstComment.author?.username
                  }
                  size={24}
                  className="mt-0.5 hover:opacity-80 transition-opacity"
                  profileUsername={firstComment.author?.username}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <UserNickName
                      username={firstComment.author?.username}
                      name={firstComment.author?.nickname}
                      className="font-medium text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(firstComment.created_at)}
                    </span>
                  </div>
                  <ContentWithMentions
                    text={firstComment.content}
                    className={`text-gray-900 dark:text-white text-sm whitespace-pre-wrap ${
                      !isFirstCommentExpanded ? "line-clamp-2" : ""
                    }`}
                  />
                  {/* 댓글 내용이 2줄 이상이거나 100자 이상일 때 더보기 버튼 표시 */}
                  {(firstComment.content.split("\n").length > 2 ||
                    firstComment.content.length > 100) && (
                    <button
                      onClick={toggleFirstCommentExpanded}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-1 transition-colors"
                    >
                      {isFirstCommentExpanded ? "접기" : "더 보기"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 댓글 더보기 버튼 */}
            <button
              onClick={handleOpenCommentsModal}
              className={`text-sm transition-colors ${
                post.allowComments === false
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              disabled={post.allowComments === false}
            >
              댓글 {actualCommentCount}개 모두 보기
            </button>
          </div>
        )}
      </div>

      {/* 게시글 모달 */}
      <PostModal
        post={convertToApiPost(p)}
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        initialImageIndex={currentImageIndex}
        mutatePosts={mutatePosts}
        onViewCountUpdate={(cnt) => setViewCount(cnt)}
      />
    </div>
  );
}
