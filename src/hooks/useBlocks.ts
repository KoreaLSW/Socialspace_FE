import useSWR from "swr";
import { blocksApi, BlockedUsersResponse, BlockedUser } from "@/lib/api/blocks";
import { useState } from "react";

// 차단된 사용자 목록 조회 훅
export function useBlockedUsers(page: number = 1, limit: number = 20) {
  const { data, error, isLoading, mutate } = useSWR(
    `/blocked-users?page=${page}&limit=${limit}`,
    () => blocksApi.getBlockedUsers(page, limit),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    blockedUsers: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

// 차단 관련 액션 훅
export function useBlockActions() {
  const [isLoading, setIsLoading] = useState(false);

  const toggleBlock = async (targetUserId: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await blocksApi.toggleBlock(targetUserId);
      return result;
    } catch (error) {
      console.error("차단/차단해제 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const blockUser = async (targetUserId: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await blocksApi.toggleBlock(targetUserId);
      return result;
    } catch (error) {
      console.error("차단 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unblockUser = async (targetUserId: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await blocksApi.toggleBlock(targetUserId);
      return result;
    } catch (error) {
      console.error("차단 해제 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleBlock,
    blockUser,
    unblockUser,
    isLoading,
  };
}
