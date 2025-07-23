"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// 분리된 컴포넌트들 import
import PostCreator from "./components/home/PostCreator";
import PostList from "./components/home/PostList";
import { usePosts } from "@/hooks/usePosts";
import { ApiPost, Post } from "@/types/post";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user;
  const isLoading = status === "loading";

  const { posts, isLoading: postsLoading } = usePosts();

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

  if (isLoading || postsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const mappedPosts: Post[] = (posts as ApiPost[]).map((post) => ({
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

  console.log("mappedPosts", posts);
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
    </>
  );
}
