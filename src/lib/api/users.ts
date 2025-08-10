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
};
