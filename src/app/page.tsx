"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { posts } from "@/lib/data";

// 분리된 컴포넌트들 import
import PostCreator from "./components/home/PostCreator";
import PostList from "./components/home/PostList";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user;
  const isLoading = status === "loading";

  // 포스트 작성 클릭 핸들러
  const handlePostClick = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    router.push("/create");
  };

  // 포스트 액션 핸들러들
  const handleLike = (postId: number) => {
    console.log("좋아요:", postId);
    // TODO: 좋아요 API 호출
  };

  const handleComment = (postId: number) => {
    console.log("댓글:", postId);
    // TODO: 댓글 기능 구현
  };

  const handleShare = (postId: number) => {
    console.log("공유:", postId);
    // TODO: 공유 기능 구현
  };

  const handleHashtagClick = (hashtag: string) => {
    console.log("해시태그 클릭:", hashtag);
    // TODO: 해시태그 검색 페이지로 이동
    // router.push(`/search?hashtag=${encodeURIComponent(hashtag)}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <PostCreator user={user} onPostClick={handlePostClick} />

      <PostList
        posts={posts}
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
