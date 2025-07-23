// 서버 응답용 타입
export interface ApiPost {
  id: string;
  content: string;
  images?: Array<{ id: string; image_url: string }>;
  hashtags?: Array<{ id: string; tag: string }>;
  created_at: string;
  visibility: string;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  author?: {
    nickname: string;
    profileImage?: string;
  };
}

// UI에서 사용하는 포스트 타입 (기존 HomePost → Post로 통일)
export interface Post {
  id: string;
  username: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  hashtags?: string[];
}

// 사용자 타입
export interface User {
  id: string;
  username: string;
  avatar?: string;
  nickname?: string;
  profile_image?: string;
  followers: number;
  isVerified?: boolean;
}

// 트렌드 타입
export interface Trend {
  hashtag: string;
  postCount: string;
}
