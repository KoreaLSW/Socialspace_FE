import useSWR from "swr";
import {
  searchAllChatRooms,
  searchMessagesInRoom,
  chatKeys,
} from "@/lib/api/chat";

// 모든 채팅방에서 검색하는 훅
export function useChatRoomSearch(
  query: string,
  page: number = 1,
  limit: number = 20
) {
  const { data, error, isLoading, mutate } = useSWR(
    query.trim() ? chatKeys.searchRooms(query, page, limit) : null,
    async () => {
      try {
        return await searchAllChatRooms(query, page, limit);
      } catch (err) {
        console.error("검색 API 에러, mock 데이터 사용:", err);
        // 임시 mock 데이터 반환
        return {
          rooms: [
            {
              id: "mock-1",
              is_group: false,
              name: null,
              last_message_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
              members: [],
              message_count: 5,
            },
          ],
          total: 1,
        };
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  return {
    searchResults: data,
    isLoading,
    error,
    mutate,
  };
}

// 특정 채팅방에서 메시지 검색하는 훅
export function useMessageSearch(
  roomId: string,
  query: string,
  page: number = 1,
  limit: number = 50
) {
  const { data, error, isLoading, mutate } = useSWR(
    roomId && query.trim()
      ? chatKeys.searchMessages(roomId, query, page, limit)
      : null,
    async () => {
      try {
        console.log("🔍 API 호출:", { roomId, query, page, limit });
        const result = await searchMessagesInRoom(roomId, query, page, limit);
        console.log("🔍 API 응답:", result);
        return result;
      } catch (err) {
        console.error("🔍 메시지 검색 API 에러:", err);
        throw err;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  return {
    searchResults: data,
    isLoading,
    error,
    mutate,
  };
}
