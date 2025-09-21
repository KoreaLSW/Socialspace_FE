import { useState, useCallback, useEffect } from "react";
import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import {
  chatKeys,
  getUserRooms,
  getRoomMessages,
  createOrGetRoom,
  ChatRoom,
  ChatMessage,
  ChatRoomsResponse,
  ChatMessagesResponse,
} from "@/lib/api/chat";
import {
  sendMessage as socketSendMessage,
  joinRoom as socketJoinRoom,
  markMessageAsRead as socketMarkAsRead,
  sendTypingStatus,
} from "@/lib/socket";
import { useSocketEvents } from "./useSocket";

// ========== 채팅방 목록 관리 훅 ==========

/**
 * 사용자의 채팅방 목록 조회 훅
 */
export const useChatRooms = (page: number = 1, limit: number = 20) => {
  const { data, error, isLoading, mutate } = useSWR(
    chatKeys.rooms(page, limit),
    () => getUserRooms(page, limit),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30초
    }
  );

  return {
    rooms: data?.data || [],
    totalCount: data?.pagination?.total || 0,
    totalPages: data?.pagination?.totalPages || 0,
    currentPage: data?.pagination?.page || page,
    isLoading,
    error,
    mutate,
  };
};

// ========== 채팅방 메시지 관리 훅 ==========

/**
 * 채팅방 메시지 무한 스크롤 훅
 */
export const useChatMessages = (roomId: string, limit: number = 50) => {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<ChatMessagesResponse>(
      (pageIndex, previousPageData) => {
        if (!roomId) return null;

        // 첫 페이지
        if (pageIndex === 0) return chatKeys.roomMessages(roomId, 1, limit);

        // 더 로드할 페이지가 있는지 확인
        if (
          previousPageData &&
          previousPageData.pagination.page <
            previousPageData.pagination.totalPages
        ) {
          return chatKeys.roomMessages(roomId, pageIndex + 1, limit);
        }

        return null; // 더 이상 로드할 페이지가 없음
      },
      async ([, , , page]) => {
        try {
          return await getRoomMessages(roomId, page, limit);
        } catch (error: any) {
          console.error("메시지 조회 실패:", error);
          // 에러 시 빈 응답 반환하여 UI 깨짐 방지
          return {
            success: false,
            data: [],
            pagination: {
              page: page,
              limit: limit,
              total: 0,
              totalPages: 0,
            },
            message: "메시지 조회에 실패했습니다.",
          };
        }
      },
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 0,
        keepPreviousData: false,
        onError: (error) => {
          console.error("SWR 메시지 조회 에러:", error);
        },
      }
    );

  // 모든 페이지의 메시지를 하나의 배열로 합치기
  const allMessages =
    data && Array.isArray(data) ? data.flatMap((page) => page?.data || []) : [];

  // 중복 제거 및 시간순 정렬
  const uniqueMessages = allMessages
    .filter((message, index, self) => {
      if (!message || !message.id) return false;
      return index === self.findIndex((m) => m && m.id === message.id);
    })
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  const totalPages = data?.[0]?.pagination?.totalPages || 0;
  const totalCount = data?.[0]?.pagination?.total || 0;
  const hasMore = size < totalPages;

  return {
    messages: uniqueMessages,
    totalCount,
    totalPages,
    currentPage: size,
    isLoading,
    isLoadingMore: isValidating && data && data.length > 0,
    error,
    mutate,
    loadMore: () => setSize(size + 1),
    hasMore,
  };
};

// ========== 채팅 액션 훅 ==========

/**
 * 채팅 관련 액션들을 관리하는 훅
 */
export const useChatActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 채팅방 생성 또는 기존 채팅방 반환
   */
  const createOrGetChatRoom = useCallback(
    async (
      targetUserId: string,
      isGroup: boolean = false,
      name?: string
    ): Promise<ChatRoom> => {
      setIsLoading(true);
      try {
        const room = await createOrGetRoom(targetUserId, isGroup, name);

        // 채팅방 목록 캐시 갱신
        mutate(
          (key) =>
            Array.isArray(key) && key[0] === "chat" && key[1] === "rooms",
          undefined,
          { revalidate: true }
        );

        return room;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 메시지 전송 (Socket.io 우선, HTTP API 백업)
   */
  const sendMessage = useCallback(
    async (
      roomId: string,
      content: string,
      messageType: "text" | "image" | "file" = "text",
      fileData?: {
        file_url?: string;
        file_name?: string;
        file_size?: number;
      }
    ): Promise<ChatMessage> => {
      setIsLoading(true);
      try {
        // Socket.io로 메시지 전송 시도
        const message = await socketSendMessage(
          roomId,
          content,
          messageType,
          fileData
        );

        // 낙관적 업데이트 제거 - 실시간 이벤트에만 의존
        console.log("✅ 메시지 전송 완료, 실시간 이벤트 대기:", message);

        // 채팅방 목록 캐시 갱신 (마지막 메시지 업데이트)
        mutate(
          (key) =>
            Array.isArray(key) && key[0] === "chat" && key[1] === "rooms",
          undefined,
          { revalidate: true }
        );

        return message;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 채팅방 참여
   */
  const joinRoom = useCallback(async (roomId: string): Promise<void> => {
    try {
      await socketJoinRoom(roomId);
    } catch (error) {
      console.error("채팅방 참여 실패:", error);
      throw error;
    }
  }, []);

  /**
   * 메시지 읽음 처리
   */
  const markAsRead = useCallback(
    async (messageId: string, roomId?: string): Promise<void> => {
      try {
        await socketMarkAsRead(messageId, roomId);

        // 안읽은 메시지 수 캐시 갱신
        if (roomId) {
          mutate(chatKeys.unreadCount(roomId), undefined, { revalidate: true });
        }
      } catch (error) {
        console.error("읽음 처리 실패:", error);
        throw error;
      }
    },
    []
  );

  /**
   * 타이핑 상태 전송
   */
  const sendTyping = useCallback((roomId: string, isTyping: boolean): void => {
    sendTypingStatus(roomId, isTyping);
  }, []);

  return {
    createOrGetChatRoom,
    sendMessage,
    joinRoom,
    markAsRead,
    sendTyping,
    isLoading,
  };
};

// ========== 실시간 채팅 이벤트 훅 ==========

/**
 * 특정 채팅방의 실시간 이벤트를 처리하는 훅
 */
export const useChatRoomEvents = (roomId: string) => {
  const { onMessage, onRead, onTyping } = useSocketEvents();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // 새 메시지 수신 처리
  useEffect(() => {
    if (!roomId) return;

    console.log("🔗 실시간 메시지 리스너 등록:", roomId);
    const unsubscribe = onMessage((data: any) => {
      console.log("📨 실시간 메시지 수신:", data);
      if (data.room_id === roomId) {
        console.log("✅ 해당 채팅방 메시지 수신:", data.message);

        // 메시지 목록 캐시 업데이트
        mutate(
          (key) =>
            Array.isArray(key) &&
            key[0] === "chat" &&
            key[1] === "messages" &&
            key[2] === roomId,
          (currentData: any) => {
            console.log("📋 실시간 업데이트 - 현재 데이터:", currentData);
            if (!currentData || !Array.isArray(currentData)) return currentData;

            const updatedData = currentData.map((page: any, index: number) => {
              // 첫 번째 페이지(최신 페이지)에 메시지 추가
              if (
                index === 0 &&
                page &&
                page.data &&
                Array.isArray(page.data)
              ) {
                // 중복 메시지 체크
                const isDuplicate = page.data.some(
                  (msg: any) => msg.id === data.message.id
                );
                if (!isDuplicate) {
                  console.log("➕ 실시간 메시지 추가:", data.message);
                  return {
                    ...page,
                    data: [...page.data, data.message],
                  };
                }
              }
              return page;
            });

            console.log("✅ 실시간 업데이트 완료:", updatedData);
            return updatedData;
          },
          { revalidate: false }
        );

        // 채팅방 목록 캐시 갱신
        mutate(
          (key) =>
            Array.isArray(key) && key[0] === "chat" && key[1] === "rooms",
          undefined,
          { revalidate: true }
        );
      }
    });

    return unsubscribe;
  }, [roomId, onMessage]);

  // 메시지 읽음 상태 수신 처리
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onRead((data: any) => {
      console.log("메시지 읽음 상태 수신:", data);
      // 필요한 경우 읽음 상태 UI 업데이트
    });

    return unsubscribe;
  }, [roomId, onRead]);

  // 타이핑 상태 수신 처리
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onTyping((data: any) => {
      if (data.room_id === roomId) {
        const { user_id, is_typing } = data;

        setTypingUsers((prev) => {
          if (is_typing) {
            return prev.includes(user_id) ? prev : [...prev, user_id];
          } else {
            return prev.filter((id) => id !== user_id);
          }
        });

        // 타이핑 상태는 3초 후 자동으로 제거
        if (is_typing) {
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((id) => id !== user_id));
          }, 3000);
        }
      }
    });

    return unsubscribe;
  }, [roomId, onTyping]);

  return {
    typingUsers,
  };
};
