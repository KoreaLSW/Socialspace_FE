"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";

// 분리된 컴포넌트들 import
import PostCreator from "./components/home/PostCreator";
import PostList from "./components/home/PostList";
import { usePosts } from "@/hooks/usePosts";
import { ApiPost, Post } from "@/types/post";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<ApiPost[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const isLoading = status === "loading";

  const { posts, isLoading: postsLoading, totalPages } = usePosts(page, 10);

  // 새로운 페이지 데이터가 로드되면 기존 게시물에 추가
  useEffect(() => {
    console.log("Posts loaded:", {
      posts: posts?.length,
      page,
      totalPages,
      hasMore,
    });

    if (posts && posts.length > 0) {
      if (page === 1) {
        // 첫 페이지인 경우 기존 데이터를 대체
        setAllPosts(posts);
      } else {
        // 다음 페이지인 경우 기존 데이터에 추가
        setAllPosts((prev) => [...prev, ...posts]);
      }

      // 더 불러올 페이지가 있는지 확인
      setHasMore(page < totalPages);
      setIsLoadingMore(false);
    }
  }, [posts, page, totalPages]);

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        console.log("Intersection Observer:", {
          isIntersecting: target.isIntersecting,
          hasMore,
          postsLoading,
          isLoadingMore,
          currentPage: page,
        });

        if (
          target.isIntersecting &&
          hasMore &&
          !postsLoading &&
          !isLoadingMore
        ) {
          console.log("Loading next page:", page + 1);
          setIsLoadingMore(true);
          setPage((prev) => prev + 1);
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
  }, [hasMore, postsLoading, isLoadingMore, page]);

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

  if (isLoading || (postsLoading && page === 1)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const mappedPosts: Post[] = allPosts.map((post) => ({
    id: post.id,
    username: post.author?.nickname || "익명",
    avatar: post.author?.profileImage || "/default-avatar.png",
    time: post.created_at,
    content: post.content,
    image:
      post.images && post.images.length > 0
        ? post.images[0].image_url
        : undefined,
    likes: post.like_count || 0,
    comments: post.comment_count || 0,
    hashtags: post.hashtags?.map((h) => h.tag) || [],
  }));

  console.log("mappedPosts", allPosts);

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
      {!hasMore && allPosts.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          모든 게시물을 불러왔습니다.
        </div>
      )}
    </>
  );
}
