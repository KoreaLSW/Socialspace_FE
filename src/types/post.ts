// 서버 응답용 타입
export interface ApiPost {
  id: string;
  content: string;
  images?: Array<{ id: string; image_url: string }>;
  hashtags?: Array<{ id: string; tag: string }>;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  visibility: "public" | "followers" | "private";
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  is_liked?: boolean; // 현재 사용자의 좋아요 상태
  hide_likes?: boolean;
  hide_views?: boolean;
  allow_comments?: boolean;
  author?: {
    id: string;
    username: string;
    nickname: string;
    profileImage?: string;
  };
}

// UI에서 사용하는 포스트 타입 (기존 HomePost → Post로 통일)
export interface Post {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  time: string;
  updatedAt?: string;
  isEdited?: boolean;
  visibility: "public" | "followers" | "private";
  content: string;
  image?: string | string[]; // 단일 이미지 또는 이미지 배열
  likes: number;
  comments: number;
  hashtags?: string[];
  isLiked?: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
  viewCount?: number; // 조회수
  hideLikes?: boolean;
  hideViews?: boolean;
  allowComments?: boolean;
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
  is_edited?: boolean;
  parent_id?: string;
  reply_to_comment_id?: string;
  reply_count?: number;
}

// 트렌드 타입
export interface Trend {
  hashtag: string;
  postCount: string;
}
