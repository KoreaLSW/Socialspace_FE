"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCurrentUser } from "@/hooks/useAuth";

// 분리된 컴포넌트들 import
import PostCreator from "./components/home/PostCreator";
import PostList from "./components/home/PostList";
import { useInfinitePosts } from "@/hooks/usePosts";
import { ApiPost, Post } from "@/types/post";

export default function HomePage() {
  const { user } = useCurrentUser();

  const router = useRouter();
  const loadingRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    posts,
    isLoading,
    isValidating,
    hasMore,
    setSize,
    size,
    error,
    mutate: mutatePosts,
  } = useInfinitePosts(10);

  // 수동 로딩 상태 관리 - isValidating만 사용
  useEffect(() => {
    if (isValidating) {
      setIsLoadingMore(true);
    } else {
      // 약간의 지연을 두어 로딩 상태가 더 명확하게 보이도록 함
      const timer = setTimeout(() => {
        setIsLoadingMore(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isValidating]);

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isValidating
        ) {
          console.log("Loading next page:", size + 1);
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
  }, [hasMore, isLoadingMore, isValidating, size, setSize]);

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
    // # 제거하고 태그 페이지로 이동
    const cleanTag = hashtag.replace(/^#/, "");
    router.push(`/tag/${encodeURIComponent(cleanTag)}`);
  };

  if (isValidating && size === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-500 dark:text-gray-400">
            게시물을 불러오는 중...
          </span>
        </div>
      </div>
    );
  }

  const mappedPosts: Post[] = posts.map((post) => ({
    id: post.id,
    username: post.author?.username || "익명",
    nickname: post.author?.nickname || post.author?.username || "익명",
    avatar: post.author?.profileImage || "/default-avatar.png",
    time: post.created_at,
    updatedAt: post.updated_at,
    isEdited: post.is_edited === true,
    content: post.content,
    image:
      post.images && post.images.length > 0
        ? post.images.map((img) => img.image_url) // 모든 이미지 URL 배열로 변환
        : undefined,
    likes: post.like_count || 0,
    comments: post.comment_count || 0,
    hashtags: post.hashtags?.map((h) => h.tag) || [],
    isLiked: post.is_liked || false, // 좋아요 상태 매핑 복원
    viewCount: post.view_count, // 조회수 추가
    hideLikes: post.hide_likes,
    hideViews: post.hide_views,
    allowComments: post.allow_comments,
    visibility: post.visibility,
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
        mutatePosts={mutatePosts}
        showSortSelector={false}
      />

      {/* 무한 스크롤을 위한 로딩 인디케이터 */}

      <div ref={loadingRef} className="flex justify-center items-center py-8">
        {isValidating && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-500 dark:text-gray-400">
              게시물을 불러오는 중...
            </span>
          </div>
        )}
      </div>

      {/* 로딩 중이 아닐 때 더 로드할 게시물이 있는 경우 */}
      {hasMore && !isValidating && (
        <div className="flex justify-center items-center py-4">
          <span className="text-gray-400 dark:text-gray-500 text-sm">
            스크롤하여 더 많은 게시물 보기
          </span>
        </div>
      )}

      {/* 모든 게시물을 다 불러왔을 때 */}
      {!hasMore && !isValidating && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          모든 게시물을 불러왔습니다.
        </div>
      )}

      {/* 게시물이 없을 때 */}
      {!isLoading && !isValidating && size > 0 && posts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          아직 게시물이 없습니다.
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="text-center py-8 text-red-500">
          게시물을 불러오는 중 오류가 발생했습니다.
        </div>
      )}
    </>
  );
}
