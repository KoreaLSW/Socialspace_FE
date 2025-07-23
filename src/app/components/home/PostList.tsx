"use client";

import { useState, useMemo } from "react";
import PostItem from "./PostItem";
import PostSortSelector from "./PostSortSelector";
import { SortOption } from "@/lib/postSorter";
import { sortPosts } from "@/lib/postSorter";
import { Post } from "@/types/post";

interface PostListProps {
  posts: Post[];
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  currentUserId?: string;
  initialSort?: SortOption;
}

export default function PostList({
  posts,
  onLike,
  onComment,
  onShare,
  onHashtagClick,
  currentUserId,
  initialSort = "latest",
}: PostListProps) {
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);

  // 정렬된 게시물 계산 (useMemo로 성능 최적화)
  const sortedPosts = posts;

  return (
    <div>
      {/* 정렬 선택기 */}
      <PostSortSelector currentSort={sortOption} onSortChange={setSortOption} />

      {/* 게시물 목록 */}
      <div className="space-y-6">
        {sortedPosts.length > 0 ? (
          sortedPosts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onHashtagClick={onHashtagClick}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              아직 게시글이 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
