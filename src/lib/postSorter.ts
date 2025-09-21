import { Post } from "@/types/post";

export type SortOption = "latest" | "popular" | "trending" | "following";

// 게시물 정렬 함수들
export const sortPosts = (
  posts: Post[],
  sortBy: SortOption,
  currentUserId?: string
): Post[] => {
  const postsCopy = [...posts];

  switch (sortBy) {
    case "latest":
      return sortByLatest(postsCopy);

    case "popular":
      return sortByPopular(postsCopy);

    case "trending":
      return sortByTrending(postsCopy);

    case "following":
      return sortByFollowing(postsCopy, currentUserId);

    default:
      return sortByLatest(postsCopy);
  }
};

// 1. 최신순 정렬
const sortByLatest = (posts: Post[]): Post[] => {
  return posts.sort((a, b) => {
    // time을 실제 날짜로 변환해서 정렬
    const dateA = new Date(a.time);
    const dateB = new Date(b.time);
    return dateB.getTime() - dateA.getTime();
  });
};

// 2. 인기순 정렬 (좋아요 + 댓글 기반)
const sortByPopular = (posts: Post[]): Post[] => {
  return posts.sort((a, b) => {
    // 인기 점수 = 좋아요 + (댓글 * 2)
    const scoreA = a.likes + a.comments * 2;
    const scoreB = b.likes + b.comments * 2;

    if (scoreB !== scoreA) {
      return scoreB - scoreA; // 인기 점수 높은 순
    }

    // 인기 점수가 같으면 최신순
    const dateA = new Date(a.time);
    const dateB = new Date(b.time);
    return dateB.getTime() - dateA.getTime();
  });
};

// 3. 트렌딩 정렬 (시간 가중 인기도)
const sortByTrending = (posts: Post[]): Post[] => {
  return posts.sort((a, b) => {
    // 트렌딩 점수 = 인기 점수 * 시간 가중치
    const trendingScoreA = calculateTrendingScore(a);
    const trendingScoreB = calculateTrendingScore(b);

    return trendingScoreB - trendingScoreA;
  });
};

// 4. 팔로잉 우선 정렬
const sortByFollowing = (posts: Post[], currentUserId?: string): Post[] => {
  // TODO: 실제 팔로잉 관계를 API에서 가져와야 함
  // 현재는 임시로 최신순 정렬로 대체
  return posts.sort((a, b) => {
    const dateA = new Date(a.time);
    const dateB = new Date(b.time);
    return dateB.getTime() - dateA.getTime();
  });
};

// 트렌딩 점수 계산 (시간 가중치 적용)
const calculateTrendingScore = (post: Post): number => {
  const baseScore = post.likes + post.comments * 2;

  // 시간 가중치 계산 (실제 날짜 사용)
  const postDate = new Date(post.time);
  const now = new Date();
  const hoursAgo = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
  const timeDecayFactor = Math.max(0.1, 1 - hoursAgo / 48); // 48시간 후 10%까지 감소

  return baseScore * timeDecayFactor;
};

// 정렬 옵션별 설명
export const getSortDescription = (sortOption: SortOption): string => {
  switch (sortOption) {
    case "latest":
      return "가장 최근에 작성된 게시글부터 보여줍니다.";

    case "popular":
      return "좋아요와 댓글이 많은 인기 게시글부터 보여줍니다.";

    case "trending":
      return "최근 24-48시간 내에 인기가 급상승한 게시글을 보여줍니다.";

    case "following":
      return "팔로우한 사용자의 게시글을 우선적으로 보여줍니다.";

    default:
      return "";
  }
};

// 정렬 옵션별 추천 상황
export const getSortRecommendation = (
  sortOption: SortOption
): {
  pros: string[];
  cons: string[];
  bestFor: string;
} => {
  switch (sortOption) {
    case "latest":
      return {
        pros: ["실시간성", "공정성", "새로운 콘텐츠 발견"],
        cons: ["질 낮은 게시글도 상위 노출", "인기 게시글 놓칠 수 있음"],
        bestFor: "실시간 업데이트가 중요한 경우",
      };

    case "popular":
      return {
        pros: ["고품질 콘텐츠", "검증된 인기 게시글", "놓친 인기글 발견"],
        cons: ["신규 게시글 묻힘", "편향성 가능"],
        bestFor: "양질의 콘텐츠를 원하는 경우",
      };

    case "trending":
      return {
        pros: ["최신 인기 콘텐츠", "균형있는 노출", "화제성"],
        cons: ["복잡한 알고리즘", "계산 비용"],
        bestFor: "최적의 사용자 경험을 원하는 경우",
      };

    case "following":
      return {
        pros: ["개인화된 피드", "관심 사용자 우선", "높은 관련성"],
        cons: ["echo chamber 효과", "새로운 발견 제한"],
        bestFor: "팔로우 관계가 중요한 소셜 플랫폼",
      };

    default:
      return { pros: [], cons: [], bestFor: "" };
  }
};
