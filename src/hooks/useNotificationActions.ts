import { notificationsApi } from "@/lib/api/notifications";
import { mutate } from "swr";

export function useNotificationActions() {
  const markRead = async (id: string) => {
    // 낙관적 업데이트: 목록 캐시에서 해당 항목 is_read=true로 변경, 카운트 -1
    mutate(
      (key: any) => Array.isArray(key) && key[0] === "notifications",
      (current: any) => {
        const pages = current as any[] | undefined;
        if (!Array.isArray(pages)) return current;
        const next = pages.map((p) => ({
          ...p,
          data: (p?.data || []).map((n: any) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
        }));
        return next;
      },
      false
    );
    mutate(
      ["notifications-unread-count"],
      (cur: any) => {
        if (!cur?.data) return cur;
        const next = Math.max(0, (cur.data.count || 0) - 1);
        return { ...cur, data: { count: next } };
      },
      false
    );

    await notificationsApi.markRead(id);
  };

  const markAllRead = async () => {
    mutate(
      (key: any) => Array.isArray(key) && key[0] === "notifications",
      (current: any) => {
        const pages = current as any[] | undefined;
        if (!Array.isArray(pages)) return current;
        const next = pages.map((p) => ({
          ...p,
          data: (p?.data || []).map((n: any) => ({ ...n, is_read: true })),
        }));
        return next;
      },
      false
    );
    mutate(
      ["notifications-unread-count"],
      { success: true, data: { count: 0 } },
      false
    );
    await notificationsApi.markAllRead();
  };

  return { markRead, markAllRead };
}
