// 사용자 타입 정의
export interface User {
  id: string;
  username: string;
  avatar: string;
  followers: string;
  isVerified?: boolean;
}

// 포스트 타입 정의
export interface Post {
  id: number;
  username: string;
  avatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  time: string;
  hashtags?: string[];
}

// 트렌드 타입 정의
export interface Trend {
  hashtag: string;
  postCount: string;
}

// 사용자 데이터
export const users: User[] = [
  {
    id: "1",
    username: "user123",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    followers: "1.2k",
  },
  {
    id: "2",
    username: "jane_doe",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
    followers: "2.5k",
  },
  {
    id: "3",
    username: "tech_lover",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    followers: "15.1k",
  },
  {
    id: "4",
    username: "dev_community",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face",
    followers: "12.5k",
  },
  {
    id: "5",
    username: "design_tips",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    followers: "8.2k",
  },
  {
    id: "6",
    username: "coding_life",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
    followers: "15.1k",
  },
];

// 포스트 데이터
export const posts: Post[] = [
  {
    id: 1,
    username: "user123",
    avatar: users.find((u) => u.username === "user123")?.avatar || "",
    content:
      "안녕하세요! SocialSpace에 오신 것을 환영합니다 🎉 #신규가입 #환영",
    image:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&h=300&fit=crop",
    likes: 24,
    comments: 8,
    time: "2시간 전",
    hashtags: ["신규가입", "환영"],
  },
  {
    id: 2,
    username: "jane_doe",
    avatar: users.find((u) => u.username === "jane_doe")?.avatar || "",
    content:
      "오늘 날씨가 정말 좋네요! 모두 좋은 하루 보내세요 ☀️ #좋은날씨 #일상",
    likes: 15,
    comments: 3,
    time: "4시간 전",
    hashtags: ["좋은날씨", "일상"],
  },
  {
    id: 3,
    username: "tech_lover",
    avatar: users.find((u) => u.username === "tech_lover")?.avatar || "",
    content:
      "새로운 기술 트렌드에 대해 토론해보고 싶어요! 어떤 것들이 흥미로우신가요? #개발 #기술",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=300&fit=crop",
    likes: 42,
    comments: 16,
    time: "6시간 전",
    hashtags: ["개발", "기술"],
  },
  {
    id: 4,
    username: "dev_community",
    avatar: users.find((u) => u.username === "dev_community")?.avatar || "",
    content: "코딩하면서 듣기 좋은 플레이리스트 공유해요! #개발 #음악 #코딩",
    likes: 67,
    comments: 23,
    time: "8시간 전",
    hashtags: ["개발", "음악", "코딩"],
  },
  {
    id: 5,
    username: "design_tips",
    avatar: users.find((u) => u.username === "design_tips")?.avatar || "",
    content: "UI/UX 디자인 트렌드 2024 정리해봤어요! #디자인 #UIUX #트렌드",
    image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop",
    likes: 89,
    comments: 34,
    time: "12시간 전",
    hashtags: ["디자인", "UIUX", "트렌드"],
  },
];

// 트렌드 데이터 (포스트에서 추출된 해시태그 기반)
export const getTrends = (): Trend[] => {
  const hashtagCount: { [key: string]: number } = {};

  // 모든 포스트의 해시태그 수집
  posts.forEach((post) => {
    post.hashtags?.forEach((hashtag) => {
      hashtagCount[hashtag] = (hashtagCount[hashtag] || 0) + 1;
    });
  });

  // 인기 순으로 정렬하여 상위 5개 반환
  return Object.entries(hashtagCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([hashtag, count]) => ({
      hashtag: `#${hashtag}`,
      postCount: `${count * 8.3}k 게시물`,
    }));
};

// 추천 사용자 (팔로워 수 기준 상위 3명)
export const getSuggestedUsers = (): User[] => {
  return users
    .filter((user) => !["user123"].includes(user.username)) // 본인 제외
    .sort((a, b) => {
      const aFollowers = parseFloat(a.followers.replace("k", ""));
      const bFollowers = parseFloat(b.followers.replace("k", ""));
      return bFollowers - aFollowers;
    })
    .slice(0, 3);
};
