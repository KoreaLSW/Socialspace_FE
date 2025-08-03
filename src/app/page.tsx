"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";

// 분리된 컴포넌트들 import
import PostCreator from "./components/home/PostCreator";
import PostList from "./components/home/PostList";
import { useInfinitePosts } from "@/hooks/usePosts";
import { ApiPost, Post } from "@/types/post";

export default function HomePage() {
  const { data: session, status } = useSession();

  const router = useRouter();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const isLoading = status === "loading";

  const {
    posts,
    isLoading: postsLoading,
    hasMore,
    setSize,
    size,
  } = useInfinitePosts(10);

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          hasMore &&
          !postsLoading &&
          !isLoadingMore
        ) {
          console.log("Loading next page:", size + 1);
          setIsLoadingMore(true);
          setSize(size + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [hasMore, postsLoading, isLoadingMore, size, setSize]);

  // 포스트 작성 클릭 핸들러
  const handlePostClick = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    router.push("/create");
  };

  // 포스트 액션 핸들러들
  const handleLike = (postId: string) => {
    console.log("좋아요:", postId);
    // TODO: 좋아요 API 호출
  };

  const handleComment = (postId: string) => {
    console.log("댓글:", postId);
    // TODO: 댓글 기능 구현
  };

  const handleShare = (postId: string) => {
    console.log("공유:", postId);
    // TODO: 공유 기능 구현
  };

  const handleHashtagClick = (hashtag: string) => {
    console.log("해시태그 클릭:", hashtag);
    // TODO: 해시태그 검색 페이지로 이동
    // router.push(`/search?hashtag=${encodeURIComponent(hashtag)}`);
  };

  if (isLoading || (postsLoading && size === 0)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const mappedPosts: Post[] = posts.map((post) => ({
    id: post.id,
    username: post.author?.username || "익명",
    nickname: post.author?.nickname || post.author?.username || "익명",
    avatar: post.author?.profileImage || "/default-avatar.png",
    time: post.created_at,
    content: post.content,
    image:
      post.images && post.images.length > 0
        ? post.images.map((img) => img.image_url) // 모든 이미지 URL 배열로 변환
        : undefined,
    likes: post.like_count || 0,
    comments: post.comment_count || 0,
    hashtags: post.hashtags?.map((h) => h.tag) || [],
    isLiked: post.is_liked || false, // 좋아요 상태 매핑 복원
  }));

  return (
    <>
      <PostCreator user={user} onPostClick={handlePostClick} />
      <PostList
        posts={mappedPosts}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onHashtagClick={handleHashtagClick}
        currentUserId={(user as any)?.id}
        initialSort="latest"
      />

      {/* 무한 스크롤을 위한 로딩 인디케이터 */}
      {hasMore && (
        <div ref={loadingRef} className="flex justify-center items-center py-8">
          {isLoadingMore && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          )}
        </div>
      )}

      {/* 모든 게시물을 다 불러왔을 때 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          모든 게시물을 불러왔습니다.
        </div>
      )}
    </>
  );
}
