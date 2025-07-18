"use client";

import { Heart, MessageCircle as Comment, Share, Hash } from "lucide-react";

interface PostItemProps {
  post: {
    id: number;
    username: string;
    avatar: string;
    time: string;
    content: string;
    image?: string;
    likes: number;
    comments: number;
    hashtags?: string[];
  };
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onShare?: (postId: number) => void;
  onHashtagClick?: (hashtag: string) => void;
}

export default function PostItem({
  post,
  onLike,
  onComment,
  onShare,
  onHashtagClick,
}: PostItemProps) {
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
        <p className="text-gray-900 dark:text-white">{post.content}</p>

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
      {post.image && (
        <div className="px-4 pb-3">
          <img
            src={post.image}
            alt="Post image"
            className="w-full rounded-lg object-cover max-h-96"
          />
        </div>
      )}

      {/* 포스트 액션 */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors"
              onClick={() => onLike?.(post.id)}
            >
              <Heart size={20} />
              <span>{post.likes}</span>
            </button>
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
