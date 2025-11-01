"use client";

import { useState, useMemo } from "react";
import PostItem from "./PostItem";
import PostSortSelector from "./PostSortSelector";
import { SortOption } from "@/lib/postSorter";
import { Post } from "@/types/post";

interface PostListProps {
  posts: Post[];
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  currentUserId?: string;
  initialSort?: SortOption;
  mutatePosts?: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
  showSortSelector?: boolean;
}

export default function PostList({
  posts,
  onLike,
  onComment,
  onShare,
  onHashtagClick,
  currentUserId,
  initialSort = "latest",
  mutatePosts,
  showSortSelector = true,
}: PostListProps) {
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);

  // 정렬된 게시물 계산 (useMemo로 성능 최적화)
  const sortedPosts = posts;
  return (
    <div>
      {/* 정렬 선택기 */}
      {showSortSelector && (
        <PostSortSelector currentSort={sortOption} onSortChange={setSortOption} />
      )}

      {/* 게시물 목록 */}
      <div className="space-y-6">
        {sortedPosts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onHashtagClick={onHashtagClick}
            mutatePosts={mutatePosts}
          />
        ))}
      </div>
    </div>
  );
}
