import useSWR from "swr";
import { followApi, FavoritesResponse, FavoriteUser } from "@/lib/api/follows";
import { useState } from "react";

// 친한친구 목록 조회 훅
export function useFavorites(page: number = 1, limit: number = 20) {
  const { data, error, isLoading, mutate } = useSWR(
    `/favorites?page=${page}&limit=${limit}`,
    () => followApi.getFavorites(page, limit),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    favorites: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

// 친한친구 관리 액션 훅
export function useFavoriteActions() {
  const [isLoading, setIsLoading] = useState(false);

  const addFavorite = async (targetUserId: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await followApi.toggleFavorite(targetUserId);
      return result;
    } catch (error) {
      console.error("친한친구 추가 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (targetUserId: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await followApi.toggleFavorite(targetUserId);
      return result;
    } catch (error) {
      console.error("친한친구 제거 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (targetUserId: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await followApi.toggleFavorite(targetUserId);
      return result;
    } catch (error) {
      console.error("친한친구 토글 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isLoading,
  };
}
