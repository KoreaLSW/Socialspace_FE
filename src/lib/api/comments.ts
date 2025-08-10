import { expressApi } from "./config";

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  author?: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  replies?: Comment[];
  like_count?: number;
  is_liked?: boolean;
}

export interface CreateCommentData {
  post_id: string;
  content: string;
  parent_id?: string;
}

// 댓글 생성
export const createComment = async (data: CreateCommentData) => {
  const response = await expressApi.post("/comments", data);
  return response.data;
};

// 게시글의 댓글 목록 조회
export const getCommentsByPostId = async (
  postId: string,
  page: number = 1,
  limit: number = 20
) => {
  const response = await expressApi.get(
    `/comments/post/${postId}?page=${page}&limit=${limit}`
  );
  return response.data;
};

// 특정 댓글이 몇 번째 페이지에 있는지 계산
export const getCommentPage = async (commentId: string, limit: number = 20) => {
  const response = await expressApi.get(
    `/comments/${commentId}/page?limit=${limit}`
  );
  return response.data;
};

// 댓글의 대댓글 조회
export const getRepliesByCommentId = async (commentId: string) => {
  const response = await expressApi.get(`/comments/${commentId}/replies`);
  return response.data;
};

// 댓글 수정
export const updateComment = async (commentId: string, content: string) => {
  const response = await expressApi.put(`/comments/${commentId}`, { content });
  return response.data;
};

// 댓글 삭제
export const deleteComment = async (commentId: string) => {
  const response = await expressApi.delete(`/comments/${commentId}`);
  return response.data;
};

// 게시글의 댓글 수 조회
export const getCommentCount = async (postId: string) => {
  const response = await expressApi.get(`/comments/post/${postId}/count`);
  return response.data;
};

// 댓글 좋아요
export const likeComment = async (commentId: string) => {
  const response = await expressApi.post(`/comments/${commentId}/like`);
  return response.data;
};

// 댓글 좋아요 취소
export const unlikeComment = async (commentId: string) => {
  const response = await expressApi.delete(`/comments/${commentId}/like`);
  return response.data;
};

// 단일 댓글 조회 (상단 고정 표시용)
export const getCommentById = async (commentId: string) => {
  const response = await expressApi.get(`/comments/${commentId}`);
  return response.data;
};
