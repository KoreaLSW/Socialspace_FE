import useSWR from "swr";
import { expressApi } from "../lib/api";

// Post 타입 정의
export interface Post {
  id: string;
  content: string;
  visibility: "public" | "followers" | "private";
  hide_likes: boolean;
  hide_views: boolean;
  allow_comments: boolean;
  images?: string[];
  hashtags?: string[];
  author: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
}

// API 응답 타입
export interface PostsResponse {
  success: boolean;
  data: {
    posts: Post[];
    totalCount: number;
    page: number;
    totalPages: number;
  };
  message: string;
}

// fetcher 함수들
const fetcher = async (url: string) => {
  const response = await expressApi.get(url);
  return response.data;
};

// 게시글 목록 조회 훅
export const usePosts = (page: number = 1, limit: number = 10) => {
  const { data, error, isLoading, mutate } = useSWR<PostsResponse>(
    `/api/posts?page=${page}&limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분
    }
  );

  return {
    posts: data?.data?.posts || [],
    totalCount: data?.data?.totalCount || 0,
    totalPages: data?.data?.totalPages || 0,
    isLoading,
    error,
    mutate,
  };
};

// 특정 게시글 조회 훅
export const usePost = (postId: string) => {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: Post;
    message: string;
  }>(postId ? `/api/posts/${postId}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    post: data?.data,
    isLoading,
    error,
    mutate,
  };
};

// 사용자별 게시글 조회 훅
export const useUserPosts = (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const { data, error, isLoading, mutate } = useSWR<PostsResponse>(
    userId ? `/api/posts/user/${userId}?page=${page}&limit=${limit}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분
    }
  );

  return {
    posts: data?.data?.posts || [],
    totalCount: data?.data?.totalCount || 0,
    totalPages: data?.data?.totalPages || 0,
    isLoading,
    error,
    mutate,
  };
};

// 해시태그별 게시글 조회 훅
export const useHashtagPosts = (
  hashtagId: string,
  page: number = 1,
  limit: number = 10
) => {
  const { data, error, isLoading, mutate } = useSWR<PostsResponse>(
    hashtagId
      ? `/api/posts/hashtag/${hashtagId}?page=${page}&limit=${limit}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분
    }
  );

  return {
    posts: data?.data?.posts || [],
    totalCount: data?.data?.totalCount || 0,
    totalPages: data?.data?.totalPages || 0,
    isLoading,
    error,
    mutate,
  };
};
