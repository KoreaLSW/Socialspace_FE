import { expressApi } from "./config";
import { User } from "@/types/post";

export const recommendedUsersApi = {
  getRecommendedUsers: async (limit = 10): Promise<User[]> => {
    const response = await expressApi.get(
      `/follow/recommended-userss?limit=${limit}`
    );
    return response.data.data;
  },
};

export const usersApi = {
  search: async (q: string, limit = 5) => {
    const response = await expressApi.get(
      `/users/search?q=${encodeURIComponent(q)}&limit=${limit}`
    );
    return response.data.data as Array<{
      id: string;
      username: string;
      nickname?: string;
      profile_image?: string;
    }>;
  },

  // 프로필 이미지 파일 업로드
  uploadProfileImage: async (imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await expressApi.post(
      "/users/profile-image/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // 프로필 이미지 Base64 업로드
  uploadBase64ProfileImage: async (imageData: string) => {
    const response = await expressApi.post(
      "/users/profile-image/upload-base64",
      {
        imageData,
      }
    );
    return response.data;
  },

  // 프로필 이미지 URL 업데이트
  updateProfileImage: async (profileImage: string) => {
    const response = await expressApi.put("/users/profile-image", {
      profileImage,
    });
    return response.data;
  },
};
