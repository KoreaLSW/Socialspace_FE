import useSWR from "swr";
import { recommendedUsersApi } from "@/lib/api/users";
import { User } from "@/types/post";
import { useCurrentUser } from "@/hooks/useAuth";

export function useRecommendedUsers(limit = 10) {
  const { isAuthenticated } = useCurrentUser();

  const {
    data = [],
    isLoading,
    error,
  } = useSWR<User[]>(
    isAuthenticated ? ["/recommended-users", limit] : null,
    () => recommendedUsersApi.getRecommendedUsers(limit)
  );

  return { recommendedUsers: data, isLoading, error };
}
