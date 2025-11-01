import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { postsApi } from "@/lib/api/posts";
import { ApiPost } from "@/types/post";

// 타입 정의
export interface PostsResponse {
  success: boolean;
  data: {
    posts: ApiPost[];
    totalCount: number;
    page: number;
    totalPages: number;
  };
  message: string;
}

export interface InfinitePostsResponse {
  success: boolean;
  data: ApiPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export interface UserPostsResponse {
  success: boolean;
  data: ApiPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export type InfinitePostsMutateFunction = (
  data?: (currentData: InfinitePostsResponse[]) => InfinitePostsResponse[],
  shouldRevalidate?: boolean
) => Promise<InfinitePostsResponse[] | undefined>;

export type UserPostsMutateFunction = (
  data?: (currentData: UserPostsResponse[]) => UserPostsResponse[],
  shouldRevalidate?: boolean
) => Promise<UserPostsResponse[] | undefined>;

// 게시글 목록 조회 훅 (무한 스크롤용)
export const useInfinitePosts = (limit: number = 10) => {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<InfinitePostsResponse>(
      (pageIndex, previousPageData) => {
        // 첫 페이지이거나 이전 페이지가 있고 더 로드할 페이지가 있는 경우
        if (pageIndex === 0) return [`/posts`, 1, limit];
        if (
          previousPageData &&
          previousPageData.pagination.page <
            previousPageData.pagination.totalPages
        ) {
          return [`/posts`, pageIndex + 1, limit];
        }
        return null; // 더 이상 로드할 페이지가 없음
      },
      ([, page, limit]) => {
        return postsApi.getAllPaginated(Number(page), Number(limit));
      },
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 0, // 캐싱 비활성화로 즉시 로딩 상태 표시
        keepPreviousData: false, // 이전 데이터를 유지하지 않음
      }
    );

  // 모든 페이지의 게시물을 하나의 배열로 합치기
  const allPosts = data ? data.flatMap((page) => page.data) : [];

  // 중복 제거 (같은 ID를 가진 게시물이 있을 경우)
  const uniquePosts = allPosts.filter((post, index, self) => {
    if (!post || !post.id) return false;
    return index === self.findIndex((p) => p && p.id && p.id === post.id);
  });

  const totalPages = data?.[0]?.pagination?.totalPages || 0;
  const totalCount = data?.[0]?.pagination?.total || 0;
  const hasMore = size < totalPages;

  // isValidating만 사용한 로딩 상태 관리
  const isLoadingMore = isValidating && data && data.length > 0;

  return {
    posts: uniquePosts,
    totalCount,
    totalPages,
    currentPage: size,
    isLoading,
    isLoadingMore,
    isValidating, // isValidating 상태도 함께 반환
    error,
    mutate,
    size,
    setSize,
    hasMore,
  };
};

// 기존 usePosts (단일 페이지용)
export const usePosts = (page: number = 1, limit: number = 10) => {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ApiPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    message: string;
  }>(
    () => [`/posts?page`, page, limit],
    () => postsApi.getAllPaginated(page, limit),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분
    }
  );

  return {
    posts: Array.isArray(data?.data) ? data.data : [],
    totalCount: data?.pagination?.total || 0,
    totalPages: data?.pagination?.totalPages || 0,
    currentPage: data?.pagination?.page || page,
    isLoading,
    error,
    mutate,
  };
};

// 특정 게시글 조회 훅
export const usePost = (postId: string) => {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ApiPost;
    message: string;
  }>(postId ? [`post`, postId] : null, () => postsApi.getById(postId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    onError: (error: any) => {
      // 404 에러는 차단된 게시물이거나 존재하지 않는 게시물
      // 조용히 처리 (에러를 무시)
      if (error?.response?.status === 404) {
        console.log("게시물을 찾을 수 없습니다 (차단되었거나 삭제됨)");
      }
    },
  });

  return {
    post: data?.data,
    isLoading,
    error: error?.response?.status === 404 ? null : error, // 404 에러는 무시
    mutate,
  };
};

// 사용자별 게시글 조회 훅 (무한 스크롤용)
export const useUserPosts = (params: {
  userId: string;
  type: "posts" | "media" | "likes";
  limit?: number;
}) => {
  const { userId, type, limit = 12 } = params;

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<UserPostsResponse>(
      (pageIndex, previousPageData) => {
        // 첫 페이지이거나 이전 페이지가 있고 더 로드할 페이지가 있는 경우
        if (pageIndex === 0) return [`/user-posts`, userId, type, 1, limit];
        if (
          previousPageData &&
          previousPageData.pagination.page <
            previousPageData.pagination.totalPages
        ) {
          return [`/user-posts`, userId, type, pageIndex + 1, limit];
        }
        return null; // 더 이상 로드할 페이지가 없음
      },
      ([, userId, type, page, limit]) => {
        if (type === "likes") {
          return postsApi.getUserLikedPostsPaginated(
            userId as string,
            page as number,
            limit as number
          );
        }
        return postsApi.getUserPostsPaginated(
          userId as string,
          page as number,
          limit as number,
          type as any
        );
      },
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 0,
        keepPreviousData: false,
      }
    );
  // 모든 페이지의 게시물을 하나의 배열로 합치기
  const allPosts = data ? data.flatMap((page) => page.data) : [];

  // 중복 제거 (같은 ID를 가진 게시물이 있을 경우)
  const uniquePosts = allPosts.filter((post, index, self) => {
    if (!post || !post.id) return false;
    return index === self.findIndex((p) => p && p.id && p.id === post.id);
  });

  const totalPages = data?.[0]?.pagination?.totalPages || 0;
  const totalCount = data?.[0]?.pagination?.total || 0;
  const hasMore = size < totalPages;

  // isValidating만 사용한 로딩 상태 관리
  const isInitialLoading = isValidating && !data;
  const isLoadingMore = isValidating && data && data.length > 0;

  return {
    posts: uniquePosts,
    totalCount,
    totalPages,
    currentPage: size,
    isLoading: isInitialLoading,
    isLoadingMore,
    isValidating,
    error,
    mutate,
    size,
    setSize,
    hasMore,
    loadMore: () => setSize(size + 1),
  };
};

// 해시태그별 게시글 조회 훅
export const useHashtagPosts = (
  hashtagId: string,
  page: number = 1,
  limit: number = 10
) => {
  const { data, error, isLoading, mutate } = useSWR<any>(
    hashtagId ? [`hashtag-posts`, hashtagId, page, limit] : null,
    () => postsApi.getByHashtagPaginated(hashtagId, page, limit),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분
    }
  );

  return {
    posts: data?.data || [],
    totalCount: data?.pagination?.total || 0,
    totalPages: data?.pagination?.totalPages || 0,
    isLoading,
    error,
    mutate,
  };
};
