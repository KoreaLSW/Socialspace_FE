import { useState } from "react";
import useSWR from "swr";
import { followApi, FollowStatus } from "@/lib/api/follows";
import {
  optimisticToggleFollowCaches,
  rollbackFollowCaches,
  updateFollowStatusOptimistic,
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

    // 현재 상태 확인을 위해 즉시 상태를 가져옴
    let currentFollowStatus;
    try {
      const statusResponse = await followApi.checkFollowStatus(targetUserId);
      currentFollowStatus = statusResponse.data;
    } catch (error) {
      // 상태 확인 실패 시 기본값 사용
      currentFollowStatus = {
        isFollowing: false,
        isPending: false,
        isFavorite: false,
        isBlocked: false,
      };
    }

    try {
      const isCurrentlyFollowing = currentFollowStatus.isFollowing;
      const isCurrentlyPending = currentFollowStatus.isPending;

      if (isCurrentlyFollowing || isCurrentlyPending) {
        // 언팔로우 - 즉시 팔로우 해제 상태로 변경
        updateFollowStatusOptimistic(targetUserId, false, false);
      } else {
        // 팔로우 - 일단 팔로우 상태로 변경 (API 응답에서 실제 상태 확인)
        updateFollowStatusOptimistic(targetUserId, true, false);
      }

      const result = await followApi.toggleFollow(targetUserId);

      // API 응답에 따라 실제 상태로 업데이트
      if (result.data && "isFollowing" in result.data) {
        updateFollowStatusOptimistic(
          targetUserId,
          result.data.isFollowing || false,
          result.data.isPending || false
        );
      }

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
