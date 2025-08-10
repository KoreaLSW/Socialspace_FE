import useSWR from "swr";
import { notificationsApi } from "@/lib/api/notifications";

export function useUnreadNotifications() {
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    ["notifications-unread-count"],
    () => notificationsApi.getUnreadCount(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const count = data?.data?.count ?? 0;
  return { count, error, isLoading, mutate, isValidating };
}
