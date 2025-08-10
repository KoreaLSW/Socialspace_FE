import { useState } from "react";
import useSWR from "swr";
import { followApi, FollowStatus } from "@/lib/api/follows";
import {
  optimisticToggleFollowCaches,
  rollbackFollowCaches,
} from "@/lib/swr/followCache";

// 팔로우 상태 확인 훅
export function useFollowStatus(targetUserId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    targetUserId ? `/follow/status/${targetUserId}` : null,
    () => (targetUserId ? followApi.checkFollowStatus(targetUserId) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    followStatus: data?.data,
    isLoading,
    error,
    mutate,
  };
}

// 팔로우 액션 훅
export function useFollowActions(targetUserId: string, onUpdate?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const toggleFollow = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // 현재 팔로우 상태 확인을 위한 임시 호출
      const currentStatus = await followApi.checkFollowStatus(targetUserId);
      const isCurrentlyFollowing = currentStatus.data.isFollowing;

      // 낙관적 업데이트 일괄 적용
      optimisticToggleFollowCaches(targetUserId, isCurrentlyFollowing);

      const result = await followApi.toggleFollow(targetUserId);
      if (onUpdate) onUpdate();
      return result;
    } catch (error) {
      console.error("팔로우 처리 실패:", error);
      // 실패 시 롤백
      rollbackFollowCaches(targetUserId);

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await followApi.toggleFavorite(targetUserId);
      if (onUpdate) onUpdate();
      return result;
    } catch (error) {
      console.error("친한친구 처리 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBlock = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await followApi.toggleBlock(targetUserId);
      if (onUpdate) onUpdate();
      return result;
    } catch (error) {
      console.error("차단 처리 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleFollow,
    toggleFavorite,
    toggleBlock,
    isLoading,
  };
}
