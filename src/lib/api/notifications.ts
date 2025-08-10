import { expressApi } from "./config";

export interface NotificationUserSummary {
  id: string;
  username: string;
  nickname: string;
  profile_image?: string | null;
}

export interface NotificationPostSummary {
  id: string;
  content?: string | null;
  thumbnail_url?: string | null;
}

export interface NotificationCommentSummary {
  id: string;
  content?: string | null;
  post_id: string;
}

export interface NotificationDto {
  id: string;
  user_id: string;
  type: string;
  from_user_id: string;
  target_id: string;
  is_read: boolean;
  created_at: string;
  from_user?: NotificationUserSummary;
  post?: NotificationPostSummary;
  comment?: NotificationCommentSummary;
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationDto[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationsApi = {
  getList: async (page = 1, limit = 20): Promise<NotificationListResponse> => {
    const res = await expressApi.get(
      `/notifications?page=${page}&limit=${limit}`
    );
    return res.data;
  },
  getUnreadCount: async (): Promise<{
    success: boolean;
    data: { count: number };
  }> => {
    const res = await expressApi.get(`/notifications/unread-count`);
    return res.data;
  },
  markRead: async (id: string): Promise<{ success: boolean }> => {
    const res = await expressApi.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async (): Promise<{ success: boolean }> => {
    const res = await expressApi.patch(`/notifications/read-all`);
    return res.data;
  },
};
