import { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  notificationPreferencesApi,
  NotificationPreferences,
} from "@/lib/api/notificationPreferences";

// 알림 설정 조회 훅
export function useNotificationPreferences() {
  const { data, error, isLoading, mutate } = useSWR(
    "/notification-preferences",
    notificationPreferencesApi.getNotificationPreferences,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    preferences: data?.data,
    isLoading,
    error,
    mutate,
  };
}

// 알림 설정 액션 훅
export function useNotificationPreferencesActions() {
  const [isLoading, setIsLoading] = useState(false);

  const updatePreferences = async (
    preferences: Partial<NotificationPreferences>
  ) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result =
        await notificationPreferencesApi.updateNotificationPreferences(
          preferences
        );

      // SWR 캐시 업데이트
      await mutate(
        "/notification-preferences",
        { success: true, data: result.data },
        false
      );

      return result;
    } catch (error) {
      console.error("알림 설정 업데이트 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = async (type: keyof NotificationPreferences) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result =
        await notificationPreferencesApi.toggleNotificationPreference(type);

      // SWR 캐시 업데이트
      await mutate(
        "/notification-preferences",
        { success: true, data: result.data },
        false
      );

      return result;
    } catch (error) {
      console.error("알림 설정 토글 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updatePreferences,
    togglePreference,
    isLoading,
  };
}
