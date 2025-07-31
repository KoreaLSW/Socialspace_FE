"use client";

import { Post } from "@/types/post";
import { MessageCircle as Comment, Share, Hash } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import LikeButton from "./LikeButton";
import ImageSlider from "../common/ImageSlider";

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
          <ImageSlider
            images={images}
            className="rounded-lg"
            imageClassName="max-h-96"
            resetKey={post.id}
          />
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
              onClick={() => onComment?.(post.id)}
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
    </div>
  );
}
