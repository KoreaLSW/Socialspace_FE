"use client";

import { Heart } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePostActions } from "@/hooks/usePostActions";
import { mutate } from "swr";
import { SWRInfiniteKeyedMutator } from "swr/infinite";
import {
  InfinitePostsResponse,
  UserPostsResponse,
  InfinitePostsMutateFunction,
} from "@/hooks/usePosts";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (postId: string, isLiked: boolean, newCount: number) => void;
  size?: number;
  className?: string;
  mutatePosts?: InfinitePostsMutateFunction;
  mutateUserPosts?: SWRInfiniteKeyedMutator<any>;
}

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  onLikeChange,
  size = 20,
  className = "",
  mutatePosts,
  mutateUserPosts,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null); // 디바운스 타이머
  const lastIntendedState = useRef({
    isLiked: initialLiked,
    likeCount: initialCount,
  }); // 마지막 상태 저장
  const { likePost, unlikePost } = usePostActions();

  // props가 변경될 때 상태 업데이트
  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 현재 상태 저장
    const newLiked = !isLiked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;

    // UI는 즉시 반응
    setIsLiked(newLiked);
    setLikeCount(newCount);

    // 서버 전송용으로 상태 기억
    lastIntendedState.current = {
      isLiked: newLiked,
      likeCount: newCount,
    };

    // 이전 타이머 제거
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 전역 mutate를 사용하여 모든 관련 캐시 업데이트
    mutate((key: any) => {
      // 무한스크롤 캐시 업데이트
      if (Array.isArray(key) && key[0] === "/posts") {
        return (pages: InfinitePostsResponse[]) => {
          if (!pages || !Array.isArray(pages)) return pages;
          return pages.map((page) => ({
            ...page,
            data: page.data.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    is_liked: newLiked,
                    like_count: newCount,
                    isLiked: newLiked,
                    likes: newCount,
                  }
                : post
            ),
          }));
        };
      }
      // 사용자 게시물 캐시 업데이트
      if (Array.isArray(key) && key[0] === "/user-posts") {
        return (pages: UserPostsResponse[]) => {
          if (!pages || !Array.isArray(pages)) return pages;
          return pages.map((page) => ({
            ...page,
            data: page.data.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    is_liked: newLiked,
                    like_count: newCount,
                  }
                : post
            ),
          }));
        };
      }
      return undefined;
    }, false);

    // 개별 mutate 함수들도 호출 (기존 코드와의 호환성을 위해)
    if (mutatePosts) {
      mutatePosts((pages: InfinitePostsResponse[]) => {
        if (!pages || !Array.isArray(pages)) return pages;
        return pages.map((page) => ({
          ...page,
          data: page.data.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  is_liked: newLiked,
                  like_count: newCount,
                  isLiked: newLiked,
                  likes: newCount,
                }
              : post
          ),
        }));
      }, false);
    }

    if (mutateUserPosts) {
      mutateUserPosts((pages: UserPostsResponse[]) => {
        if (!pages || !Array.isArray(pages)) return pages;
        return pages.map((page) => ({
          ...page,
          data: page.data.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  is_liked: newLiked,
                  like_count: newCount,
                }
              : post
          ),
        }));
      }, false);
    }

    // 새 타이머 설정 (0.5초 후 서버 요청)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        if (newLiked) {
          await likePost(postId);
        } else {
          await unlikePost(postId);
        }

        onLikeChange?.(postId, newLiked, newCount);
      } catch (error) {
        console.error("좋아요 처리 실패:", error);
        // 실패 시 롤백
        setIsLiked(!newLiked);
        setLikeCount(newLiked ? newCount - 1 : newCount + 1);

        // 전역 mutate를 사용하여 모든 관련 캐시 롤백
        mutate((key: any) => {
          // 무한스크롤 캐시 롤백
          if (Array.isArray(key) && key[0] === "/posts") {
            return (pages: InfinitePostsResponse[]) => {
              if (!pages || !Array.isArray(pages)) return pages;
              return pages.map((page) => ({
                ...page,
                data: page.data.map((post) =>
                  post.id === postId
                    ? {
                        ...post,
                        is_liked: !newLiked,
                        like_count: newLiked ? newCount - 1 : newCount + 1,
                        isLiked: !newLiked,
                        likes: newLiked ? newCount - 1 : newCount + 1,
                      }
                    : post
                ),
              }));
            };
          }
          // 사용자 게시물 캐시 롤백
          if (Array.isArray(key) && key[0] === "/user-posts") {
            return (pages: UserPostsResponse[]) => {
              if (!pages || !Array.isArray(pages)) return pages;
              return pages.map((page) => ({
                ...page,
                data: page.data.map((post) =>
                  post.id === postId
                    ? {
                        ...post,
                        is_liked: !newLiked,
                        like_count: newLiked ? newCount - 1 : newCount + 1,
                      }
                    : post
                ),
              }));
            };
          }
          return undefined;
        }, false);

        // 개별 mutate 함수들도 롤백 (기존 코드와의 호환성을 위해)
        if (mutatePosts) {
          mutatePosts((pages: InfinitePostsResponse[]) => {
            if (!pages || !Array.isArray(pages)) return pages;
            return pages.map((page) => ({
              ...page,
              data: page.data.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      is_liked: !newLiked,
                      like_count: newLiked ? newCount - 1 : newCount + 1,
                      isLiked: !newLiked,
                      likes: newLiked ? newCount - 1 : newCount + 1,
                    }
                  : post
              ),
            }));
          }, false);
        }

        if (mutateUserPosts) {
          mutateUserPosts((pages: UserPostsResponse[]) => {
            if (!pages || !Array.isArray(pages)) return pages;
            return pages.map((page) => ({
              ...page,
              data: page.data.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      is_liked: !newLiked,
                      like_count: newLiked ? newCount - 1 : newCount + 1,
                    }
                  : post
              ),
            }));
          }, false);
        }
      }
    }, 500);
  };

  return (
    <button
      className={`flex items-center space-x-2 transition-all duration-200 group ${
        isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
      } ${className}`}
      onClick={handleLikeToggle}
      title={isLiked ? "좋아요 취소" : "좋아요"}
    >
      <Heart
        size={size}
        fill={isLiked ? "currentColor" : "none"}
        className={`transition-all duration-200 ${
          isLiked ? "scale-110 drop-shadow-sm" : "group-hover:scale-105"
        }`}
      />
      <span className={`font-medium ${isLiked ? "text-red-500" : ""}`}>
        {likeCount}
      </span>
    </button>
  );
}
