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
  is_liked?: boolean; // 현재 사용자의 좋아요 상태
  author?: {
    id: string;
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
  image?: string | string[]; // 단일 이미지 또는 이미지 배열
  likes: number;
  comments: number;
  hashtags?: string[];
  isLiked?: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
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

// 댓글 타입
export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    nickname: string;
    profileImage?: string;
  };
  created_at: string;
  like_count?: number;
  is_liked?: boolean;
}

// 트렌드 타입
export interface Trend {
  hashtag: string;
  postCount: string;
}
