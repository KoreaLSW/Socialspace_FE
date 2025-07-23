import { expressApi } from "./config";
import { User } from "@/types/post";

export const recommendedUsersApi = {
  getRecommendedUsers: async (limit = 10): Promise<User[]> => {
    const response = await expressApi.get(
      `/auth/recommended-userss?limit=${limit}`
    );
    return response.data.data;
  },
};
