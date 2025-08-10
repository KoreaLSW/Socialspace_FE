import useSWRInfinite from "swr/infinite";
import { notificationsApi, NotificationDto } from "@/lib/api/notifications";

const PAGE_SIZE = 20;

export function useNotifications() {
  const { data, size, setSize, isValidating, mutate, error } = useSWRInfinite(
    (pageIndex, prev) => {
      if (prev && prev.pagination) {
        const { page, totalPages } = prev.pagination;
        if (pageIndex > 0 && page >= totalPages) return null;
      }
      return ["notifications", pageIndex + 1, PAGE_SIZE];
    },
    ([, page, limit]) =>
      notificationsApi.getList(page as number, limit as number),
    {
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: 500,
    }
  );

  const pages = data || [];
  const notifications: NotificationDto[] = pages.flatMap(
    (p: any) => p?.data || []
  );
  const totalPages = pages?.[0]?.pagination?.totalPages || 0;
  const hasMore = size < totalPages;

  return { notifications, size, setSize, hasMore, isValidating, mutate, error };
}
