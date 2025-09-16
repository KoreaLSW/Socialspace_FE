import { expressApi } from "./config";

export interface NotificationPreferences {
  follow: boolean; // 팔로우 알림
  followee_post: boolean; // 팔로잉 게시물 알림
  post_liked: boolean; // 게시물 좋아요 알림
  comment_liked: boolean; // 댓글 좋아요 알림
  post_commented: boolean; // 게시물 댓글 알림
  mention_comment: boolean; // 멘션 알림
}

export const notificationPreferencesApi = {
  // 현재 알림 설정 조회
  getNotificationPreferences: async (): Promise<{
    success: boolean;
    data: NotificationPreferences;
  }> => {
    const response = await expressApi.get("/users/notification-preferences");
    return response.data;
  },

  // 알림 설정 업데이트
  updateNotificationPreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<{
    success: boolean;
    message: string;
    data: NotificationPreferences;
  }> => {
    const response = await expressApi.put(
      "/users/notification-preferences",
      preferences
    );
    return response.data;
  },

  // 개별 알림 설정 토글
  toggleNotificationPreference: async (
    type: keyof NotificationPreferences
  ): Promise<{
    success: boolean;
    message: string;
    data: NotificationPreferences;
  }> => {
    const response = await expressApi.patch(
      `/users/notification-preferences/${type}`,
      {}
    );
    return response.data;
  },
};
