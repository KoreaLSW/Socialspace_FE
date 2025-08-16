import useSWR from "swr";
import { notificationsApi } from "@/lib/api/notifications";

export function useUnreadNotifications(enabled: boolean) {
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    enabled ? "/notifications/unread-count" : null, // 세션이 있을 때만 API 호출,
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
