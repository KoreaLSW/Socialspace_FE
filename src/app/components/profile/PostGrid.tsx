import { useState, useEffect, useCallback, useRef } from "react";
import PostGridCard from "./PostGridCard";
import PostModal from "./PostModal";
import { Post } from "@/types/post";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

interface PostGridProps {
  posts: Post[];
  isLoading: boolean;
  error: any;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isInitialLoading?: boolean;
}

export default function PostGrid({
  posts,
  isLoading,
  error,
  hasMore = true,
  onLoadMore,
  isInitialLoading = false,
}: PostGridProps) {
  const { data: session } = useSession();
  const params = useParams();
  const isMyProfile = session?.user?.username === params?.username;
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // IntersectionObserver로 무한 스크롤
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && onLoadMore) {
          onLoadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasMore, onLoadMore]
  );

  // 초기 로딩 화면
  if (isInitialLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          게시물을 불러오는 중...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-red-600 mb-4">게시물을 불러오는데 실패했습니다.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          아직 게시물이 없습니다.
        </p>
        {isMyProfile && (
          <button
            onClick={() => (window.location.href = "/create")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            첫 번째 게시물 작성하기
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {posts.map((post: Post, index: number) => (
            <div
              key={`${post.id}-${index}`}
              ref={index === posts.length - 1 ? lastElementRef : null}
            >
              <PostGridCard post={post} onClick={handlePostClick} />
            </div>
          ))}
        </div>

        {isLoading && posts.length > 0 && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                더 많은 게시물을 불러오는 중...
              </span>
            </div>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              모든 게시물을 불러왔습니다.
            </p>
          </div>
        )}
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </>
  );
}
