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

  // 페이지네이션된 전체 게시글 조회
  getAllPaginated: async (page: number, limit: number) => {
    const response = await expressApi.get(`/posts?page=${page}&limit=${limit}`);
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

  // 페이지네이션된 사용자 게시글 조회
  getUserPostsPaginated: async (
    userId: string,
    page: number,
    limit: number,
    type?: "posts" | "media" | "likes"
  ) => {
    const typeQuery = type ? `&type=${type}` : "";
    const response = await expressApi.get(
      `/posts/user/${userId}?page=${page}&limit=${limit}${typeQuery}`
    );
    return response.data;
  },

  // 사용자가 좋아요한 게시글 조회 (페이지네이션)
  getUserLikedPostsPaginated: async (
    userId: string,
    page: number,
    limit: number
  ) => {
    const response = await expressApi.get(
      `/posts/user/${userId}/likes?page=${page}&limit=${limit}`
    );
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

  // 페이지네이션된 해시태그 게시글 조회
  getByHashtagPaginated: async (
    hashtagId: string,
    page: number,
    limit: number
  ) => {
    const response = await expressApi.get(
      `/posts/hashtag/${hashtagId}?page=${page}&limit=${limit}`
    );
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

  // Base64 이미지 업로드
  uploadBase64: async (imageData: string) => {
    const response = await expressApi.post("/posts/upload/base64", {
      imageData,
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
