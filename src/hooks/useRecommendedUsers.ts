import useSWR from "swr";
import { useSession } from "next-auth/react";
import { recommendedUsersApi } from "@/lib/api/users";
import { User } from "@/types/post";

export function useRecommendedUsers(limit = 10) {
  const { data: session } = useSession();

  const {
    data = [],
    isLoading,
    error,
  } = useSWR<User[]>(session ? ["/recommended-users", limit] : null, () =>
    recommendedUsersApi.getRecommendedUsers(limit)
  );

  return { recommendedUsers: data, isLoading, error };
}
