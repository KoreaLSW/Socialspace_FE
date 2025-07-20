export interface Post {
  id: string;
  content: string;
  images?: Array<{ id: string; image_url: string }>;
  hashtags?: Array<{ id: string; tag: string }>;
  created_at: string;
  visibility: string;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
}

export interface PostImage {
  id: string;
  image_url: string;
}

export interface PostHashtag {
  id: string;
  tag: string;
}

export interface PostStats {
  like_count?: number;
  comment_count?: number;
  view_count?: number;
}

export interface PostVisibility {
  visibility: "public" | "followers" | "private";
}

// 홈페이지용 Post 타입 (기존 구조 유지)
export interface HomePost {
  id: number;
  username: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  hashtags?: string[];
}
