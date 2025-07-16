import { postsApi } from "./posts";
import { authApi } from "./auth";

// SWR mutation 함수들
export const mutationFunctions = {
  // 게시글 생성
  createPost: async (url: string, { arg }: { arg: any }) => {
    return await postsApi.create(arg);
  },

  // 게시글 업데이트
  updatePost: async (
    url: string,
    { arg }: { arg: { id: string; data: any } }
  ) => {
    return await postsApi.update(arg.id, arg.data);
  },

  // 게시글 삭제
  deletePost: async (url: string, { arg }: { arg: { id: string } }) => {
    return await postsApi.delete(arg.id);
  },

  // 게시글 좋아요
  likePost: async (url: string, { arg }: { arg: { id: string } }) => {
    return await postsApi.like(arg.id);
  },

  // 게시글 좋아요 취소
  unlikePost: async (url: string, { arg }: { arg: { id: string } }) => {
    return await postsApi.unlike(arg.id);
  },

  // 프로필 업데이트
  updateProfile: async (url: string, { arg }: { arg: any }) => {
    return await authApi.updateProfile(arg);
  },

  // 로그아웃
  logout: async (url: string) => {
    return await authApi.logout();
  },
};
