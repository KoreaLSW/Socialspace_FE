import useSWR from "swr";
import { expressApi } from "../lib/api";

// 백엔드와 일치하는 Post 타입 정의
export interface RecommendedPost {
  id: string;
  user_id: string;
  content: string;
  thumbnail_url?: string;
  og_link?: string;
  created_at: string;
  updated_at: string;
  visibility: "public" | "followers" | "private";
  hide_likes: boolean;
  hide_views: boolean;
  allow_comments: boolean;
  recommendation_score: number;
  reason: string;
  // 통계 정보
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  views: number;
  // 사용자 정보 (조인으로 가져올 예정)
  author?: {
    id: string;
    nickname: string;
    profile_image?: string;
  };
  // 해시태그 (조인으로 가져올 예정)
  hashtags?: string[];
}

// API 응답 타입
export interface RecommendedPostsResponse {
  success: boolean;
  data: {
    posts: RecommendedPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  cached: boolean;
}

// fetcher 함수
const fetcher = async (url: string) => {
  const response = await expressApi.get(url);
  return response.data;
};

// 추천 게시글 조회 훅
export const useRecommendedPosts = (
  page: number = 1,
  limit: number = 10,
  algorithm: "relationship" | "engagement" | "trending" | "hybrid" = "hybrid"
) => {
  const { data, error, isLoading, mutate } = useSWR<RecommendedPostsResponse>(
    `/posts/recommended?page=${page}&limit=${limit}&algorithm=${algorithm}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // 5분마다 새로고침
      dedupingInterval: 30 * 1000, // 30초 동안 중복 요청 방지
    }
  );

  return {
    posts: data?.data?.posts || [],
    pagination: data?.data?.pagination,
    cached: data?.cached,
    isLoading,
    error,
    mutate,
  };
};

// 게시글 공유 함수
export const sharePost = async (
  postId: string,
  shareType: string = "share"
) => {
  try {
    const response = await expressApi.post(`/posts/${postId}/share`, {
      share_type: shareType,
    });
    return response.data;
  } catch (error) {
    console.error("게시글 공유 실패:", error);
    throw error;
  }
};

// 게시글 조회 기록 함수
export const recordPostView = async (
  postId: string,
  viewDuration: number = 0
) => {
  try {
    const response = await expressApi.post(`/posts/${postId}/view`, {
      view_duration: viewDuration,
    });
    return response.data;
  } catch (error) {
    console.error("게시글 조회 기록 실패:", error);
    throw error;
  }
};
