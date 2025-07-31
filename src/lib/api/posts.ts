import { expressApi } from "./config";

// 게시글 API 함수들
export const postsApi = {
  // 게시글 생성
  create: async (data: any) => {
    const response = await expressApi.post("/posts", data);
    return response.data;
  },

  // 게시글 목록 조회
  getAll: async () => {
    const response = await expressApi.get("/posts");
    return response.data;
  },

  // 특정 게시글 조회
  getById: async (id: string) => {
    const response = await expressApi.get(`/posts/${id}`);
    return response.data;
  },

  // 사용자별 게시글 조회
  getByUserId: async (userId: string) => {
    const response = await expressApi.get(`/posts/user/${userId}`);
    return response.data;
  },

  // 내 게시글 조회
  getMyPosts: async () => {
    const response = await expressApi.get("/posts/my");
    return response.data;
  },

  // 해시태그별 게시글 조회
  getByHashtag: async (hashtag: string) => {
    const response = await expressApi.get(`/posts/hashtag/${hashtag}`);
    return response.data;
  },

  // 게시글 업데이트
  update: async (id: string, data: any) => {
    const response = await expressApi.put(`/posts/${id}`, data);
    return response.data;
  },

  // 게시글 삭제
  delete: async (id: string) => {
    const response = await expressApi.delete(`/posts/${id}`);
    return response.data;
  },

  // 게시글 좋아요
  like: async (id: string) => {
    const response = await expressApi.post(`/posts/${id}/like`);
    return response.data;
  },

  // 게시글 좋아요 취소
  unlike: async (id: string) => {
    const response = await expressApi.delete(`/posts/${id}/like`);
    return response.data;
  },

  // 단일 이미지 업로드
  uploadImage: async (formData: FormData) => {
    const response = await expressApi.post("/posts/upload/single", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // 다중 이미지 업로드
  uploadImages: async (formData: FormData) => {
    const response = await expressApi.post("/posts/upload/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
