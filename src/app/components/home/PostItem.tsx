"use client";

import { Post, Comment as CommentType, ApiPost } from "@/types/post";
import { MessageCircle as Comment, Share, Hash } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import LikeButton from "./LikeButton";
import ImageSlider from "../common/ImageSlider";
import PostModal from "../profile/PostModal";

interface PostItemProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onHashtagClick?: (hashtag: string) => void;
}

export default function PostItem({
  post,
  onLike,
  onComment,
  onShare,
  onHashtagClick,
}: PostItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [firstComment, setFirstComment] = useState<CommentType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const textRef = useRef<HTMLParagraphElement>(null);

  // 텍스트가 3줄을 넘어가는지 확인
  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * 3; // 3줄 높이
      setShowMoreButton(element.scrollHeight > maxHeight);
    }
  }, [post.content]);

  // 첫 번째 댓글 로드 (임시 데이터)
  useEffect(() => {
    if (post.comments > 0) {
      // 실제로는 API에서 첫 번째 댓글만 가져와야 함
      const mockFirstComment: CommentType = {
        id: "comment1",
        content:
          "120년째 첫번인가 도무지 이해가 안가..... 주변의 진짜 잇엇으면 더 보기",
        author: {
          id: "dlsmrma",
          username: "dlsmrma",
          nickname: "dlsmrma",
          profileImage: "/default-avatar.png",
        },
        created_at: new Date().toISOString(),
      };
      setFirstComment(mockFirstComment);
    }
  }, [post.comments]);

  // 이미지 배열 처리
  const images = Array.isArray(post.image)
    ? post.image
    : post.image
    ? [post.image]
    : [];

  // 좋아요 변경 핸들러
  const handleLikeChange = (
    postId: string,
    isLiked: boolean,
    newCount: number
  ) => {
    onLike?.(postId);
  };

  // 댓글 모달 열기
  const handleOpenCommentsModal = () => {
    setIsCommentsModalOpen(true);
    onComment?.(post.id);
  };

  // 시간 포맷팅
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    return `${Math.floor(diffInHours / 24)}일 전`;
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
      like_count: post.likes,
      comment_count: post.comments,
      is_liked: post.isLiked,
      author: {
        id: post.id, // 실제로는 author id가 따로 있어야 함
        nickname: post.username,
        profileImage: post.avatar,
      },
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 포스트 헤더 */}
      <div className="p-4 flex items-center space-x-3">
        <img
          src={post.avatar}
          alt={post.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">
            {post.username}
          </p>
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
              initialLiked={post.isLiked || false}
              initialCount={post.likes}
              onLikeChange={handleLikeChange}
            />
            <button
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
              onClick={handleOpenCommentsModal}
            >
              <Comment size={20} />
              <span>{post.comments}</span>
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
        {post.comments === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            댓글 없음
          </div>
        ) : (
          <div className="space-y-2">
            {/* 첫 번째 댓글 표시 */}
            {firstComment && (
              <div className="flex items-start space-x-2">
                <img
                  src={
                    firstComment.author.profileImage || "/default-avatar.png"
                  }
                  alt={firstComment.author.nickname}
                  className="w-6 h-6 rounded-full object-cover mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {firstComment.author.nickname}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(firstComment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white text-sm line-clamp-2">
                    {firstComment.content}
                  </p>
                </div>
              </div>
            )}

            {/* 댓글 더보기 버튼 */}
            <button
              onClick={handleOpenCommentsModal}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              댓글 {post.comments}개 모두 보기
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
      />
    </div>
  );
}
