"use client";

import { Post, Comment as CommentType, ApiPost } from "@/types/post";
import { MessageCircle as Comment, Share, Hash } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LikeButton from "./LikeButton";
import ImageSlider from "../common/ImageSlider";
import PostModal from "../profile/PostModal";
import { useComments } from "@/hooks/useComments";
import { usePost } from "@/hooks/usePosts";

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
  const textRef = useRef<HTMLParagraphElement>(null);

  // 실제 댓글 데이터 가져오기
  const { comments } = useComments(post.id);
  const actualCommentCount = comments.length;

  // 텍스트가 3줄을 넘어가는지 확인
  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * 3; // 3줄 높이
      setShowMoreButton(element.scrollHeight > maxHeight);
    }
  }, [post.content]);

  // 첫 번째 댓글 로드 (실제 데이터)
  useEffect(() => {
    if (comments.length > 0) {
      setFirstComment(comments[0]);
    } else {
      setFirstComment(null);
    }
  }, [comments]);

  // 이미지 배열 처리
  const images = Array.isArray(post.image)
    ? post.image
    : post.image
    ? [post.image]
    : [];

  // 댓글 모달 열기
  const handleOpenCommentsModal = () => {
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
      visibility: "public",
      like_count: post.likes ?? 0,
      comment_count: actualCommentCount,
      is_liked: post.isLiked ?? false,
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
        <button
          onClick={() => handleProfileClick(post.username)}
          className="hover:opacity-80 transition-opacity"
        >
          <img
            src={post.avatar}
            alt={post.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        </button>
        <div className="flex-1">
          <button
            onClick={() => handleProfileClick(post.username)}
            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {post.nickname}
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {post.time}
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
            {post.content}
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
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.hashtags.map((hashtag, index) => (
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
          <div onClick={handleOpenCommentsModal} className="cursor-pointer">
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
              initialLiked={post.isLiked ?? false}
              initialCount={post.likes ?? 0}
              mutatePosts={mutatePosts}
            />
            <button
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
              onClick={handleOpenCommentsModal}
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
                <button
                  onClick={() =>
                    handleProfileClick(firstComment.author?.username)
                  }
                  className="hover:opacity-80 transition-opacity"
                >
                  <img
                    src={
                      firstComment.author?.profileImage || "/default-avatar.png"
                    }
                    alt={firstComment.author?.nickname}
                    className="w-6 h-6 rounded-full object-cover mt-0.5"
                  />
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleProfileClick(firstComment.author?.username)
                      }
                      className="font-medium text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {firstComment.author?.nickname}
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(firstComment.created_at)}
                    </span>
                  </div>
                  <p
                    className={`text-gray-900 dark:text-white text-sm whitespace-pre-wrap ${
                      !isFirstCommentExpanded ? "line-clamp-2" : ""
                    }`}
                  >
                    {firstComment.content}
                  </p>
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
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              댓글 {actualCommentCount}개 모두 보기
            </button>
          </div>
        )}
      </div>

      {/* 댓글 모달 */}
      <PostModal
        post={convertToApiPost(post)}
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        initialImageIndex={currentImageIndex}
        mutatePosts={mutatePosts}
      />
    </div>
  );
}
