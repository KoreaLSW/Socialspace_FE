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
  markAllMessagesAsRead as socketMarkAllAsRead,
  deleteMessage as socketDeleteMessage,
  sendTypingStatus,
  onMessageDeleted,
} from "@/lib/socket";
import { useSocketEvents } from "./useSocket";
import { expressApi } from "@/lib/api/config";

// ========== 채팅방 목록 관리 훅 ==========

/**
 * 사용자의 채팅방 목록 조회 훅
 */
export const useChatRooms = (
  page: number = 1,
  limit: number = 20,
  search: string = ""
) => {
  const { data, error, isLoading, mutate } = useSWR(
    chatKeys.rooms(page, limit, search),
    () => getUserRooms(page, limit, search),
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

        // 낙관적 업데이트 - 즉시 UI 반영
        console.log("🔄 낙관적 업데이트 시도:", message.id);

        // 직접 키로 mutate
        const targetKey = chatKeys.roomMessages(roomId, 1, 50);
        await mutate(
          targetKey,
          (currentData: any) => {
            if (!currentData || !Array.isArray(currentData)) return currentData;

            return currentData.map((page: any, index: number) => {
              // 첫 번째 페이지(최신 페이지)에만 메시지 추가
              if (
                index === 0 &&
                page &&
                page.data &&
                Array.isArray(page.data)
              ) {
                const isDuplicate = page.data.some(
                  (msg: any) => msg.id === message.id
                );
                if (!isDuplicate) {
                  console.log("➕ 메시지 추가됨:", message.id);
                  return {
                    ...page,
                    data: [...page.data, message],
                  };
                }
              }
              return page;
            });
          },
          { revalidate: false }
        );

        console.log("✅ 메시지 전송 완료, 낙관적 업데이트 적용:", message);

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

          // 채팅방 목록의 unread_count도 업데이트 (낙관적 업데이트)
          mutate(
            (key) =>
              Array.isArray(key) && key[0] === "chat" && key[1] === "rooms",
            (currentData: any) => {
              if (!currentData || !currentData.data) return currentData;

              const updatedRooms = currentData.data.map((room: any) => {
                if (room.id === roomId) {
                  return {
                    ...room,
                    unread_count: 0, // 읽음 처리 시 0으로 설정
                  };
                }
                return room;
              });

              return {
                ...currentData,
                data: updatedRooms,
              };
            },
            { revalidate: false }
          );
        }
      } catch (error) {
        console.error("읽음 처리 실패:", error);
        throw error;
      }
    },
    []
  );

  /**
   * 채팅방의 모든 메시지 읽음 처리
   */
  const markAllAsRead = useCallback(async (roomId: string): Promise<void> => {
    try {
      await socketMarkAllAsRead(roomId);

      // 안읽은 메시지 수 캐시 갱신
      mutate(chatKeys.unreadCount(roomId), undefined, { revalidate: true });

      // 채팅방 목록의 unread_count도 업데이트 (낙관적 업데이트)
      mutate(
        (key) => Array.isArray(key) && key[0] === "chat" && key[1] === "rooms",
        (currentData: any) => {
          if (!currentData || !currentData.data) return currentData;

          const updatedRooms = currentData.data.map((room: any) => {
            if (room.id === roomId) {
              return {
                ...room,
                unread_count: 0, // 모든 메시지 읽음 처리 시 0으로 설정
              };
            }
            return room;
          });

          return {
            ...currentData,
            data: updatedRooms,
          };
        },
        { revalidate: false }
      );
    } catch (error) {
      console.error("전체 읽음 처리 실패:", error);
      throw error;
    }
  }, []);

  /**
   * 타이핑 상태 전송
   */
  const sendTyping = useCallback((roomId: string, isTyping: boolean): void => {
    sendTypingStatus(roomId, isTyping);
  }, []);

  /**
   * 메시지 삭제 (Socket.io)
   */
  const deleteMessage = useCallback(
    async (messageId: string, roomId: string): Promise<void> => {
      setIsLoading(true);
      try {
        // Socket.io로 메시지 삭제
        await socketDeleteMessage(messageId, roomId);

        // 메시지 목록 캐시 업데이트 (삭제된 메시지 표시)
        const targetKey = chatKeys.roomMessages(roomId, 1, 50);
        await mutate(
          targetKey,
          (currentData: any) => {
            if (!currentData || !Array.isArray(currentData)) return currentData;

            return currentData.map((page: any) => {
              if (page && page.data && Array.isArray(page.data)) {
                return {
                  ...page,
                  data: page.data.map((msg: any) => {
                    if (msg.id === messageId) {
                      return {
                        ...msg,
                        content: "삭제된 메시지입니다",
                        message_type: "system",
                        file_url: null,
                        file_name: null,
                        file_size: null,
                      };
                    }
                    return msg;
                  }),
                };
              }
              return page;
            });
          },
          { revalidate: false }
        );

        console.log("✅ 메시지 삭제 완료:", messageId);
      } catch (error: any) {
        console.error("❌ 메시지 삭제 실패:", error);
        throw new Error(
          error.response?.data?.message || "메시지를 삭제할 수 없습니다."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 채팅방에 멤버 추가 (그룹 채팅 초대)
   */
  const addMembers = useCallback(
    async (roomId: string, userIds: string[]): Promise<void> => {
      setIsLoading(true);
      try {
        const { addMembersToRoom } = await import("@/lib/api/chat");
        await addMembersToRoom(roomId, userIds);

        // 채팅방 멤버 목록 캐시 갱신
        mutate(
          (key) =>
            Array.isArray(key) &&
            key[0] === "chat" &&
            key[1] === "members" &&
            key[2] === roomId,
          undefined,
          { revalidate: true }
        );

        // 채팅방 목록도 갱신 (멤버 수 변경)
        mutate(
          (key) =>
            Array.isArray(key) && key[0] === "chat" && key[1] === "rooms",
          undefined,
          { revalidate: true }
        );

        console.log("✅ 멤버 추가 완료:", roomId, userIds);
      } catch (error: any) {
        console.error("❌ 멤버 추가 실패:", error);
        throw new Error(
          error.response?.data?.message || "멤버를 추가할 수 없습니다."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 채팅방 나가기
   */
  const leaveChatRoom = useCallback(
    async (roomId: string, onOptimisticUpdate?: () => void): Promise<void> => {
      setIsLoading(true);

      // 낙관적 업데이트: 즉시 UI에서 채팅방 제거
      console.log("🔄 낙관적 업데이트: 채팅방 제거 시작", roomId);

      // 상위 컴포넌트에서 제공한 낙관적 업데이트 함수 호출
      if (onOptimisticUpdate) {
        onOptimisticUpdate();
      } else {
        // 기본 전역 캐시 업데이트 (모든 채팅방 목록 캐시)
        mutate(
          (key) => {
            // ["chat", "rooms", page, limit] 형태의 키들을 찾음
            return (
              Array.isArray(key) &&
              key.length === 4 &&
              key[0] === "chat" &&
              key[1] === "rooms" &&
              typeof key[2] === "number" &&
              typeof key[3] === "number"
            );
          },
          (currentData: any) => {
            if (!currentData || !Array.isArray(currentData)) return currentData;

            return currentData.map((page: any) => {
              if (page && page.data && Array.isArray(page.data)) {
                const filteredData = page.data.filter(
                  (room: any) => room.id !== roomId
                );
                console.log(
                  `📋 페이지에서 채팅방 제거: ${page.data.length} → ${filteredData.length}`
                );
                return {
                  ...page,
                  data: filteredData,
                  totalCount: Math.max(0, (page.totalCount || 0) - 1),
                };
              }
              return page;
            });
          },
          { revalidate: false }
        );
      }

      // 해당 채팅방의 메시지 캐시 즉시 삭제
      mutate(
        (key) =>
          Array.isArray(key) &&
          key[0] === "chat" &&
          key[1] === "messages" &&
          key[2] === roomId,
        undefined,
        { revalidate: false }
      );

      try {
        // API 호출로 채팅방 나가기
        await expressApi.delete(`/chat/rooms/${roomId}/leave`);
        console.log("✅ 채팅방 나가기 API 성공:", roomId);
      } catch (error: any) {
        console.error("❌ 채팅방 나가기 실패, 롤백 수행:", error);

        // 실패 시 롤백: 채팅방 목록 다시 불러오기
        mutate(
          (key) => {
            return (
              Array.isArray(key) &&
              key.length === 4 &&
              key[0] === "chat" &&
              key[1] === "rooms" &&
              typeof key[2] === "number" &&
              typeof key[3] === "number"
            );
          },
          undefined,
          { revalidate: true }
        );

        throw new Error(
          error.response?.data?.message || "채팅방을 나갈 수 없습니다."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    createOrGetChatRoom,
    sendMessage,
    joinRoom,
    markAsRead,
    markAllAsRead,
    sendTyping,
    deleteMessage,
    addMembers,
    leaveChatRoom,
    isLoading,
  };
};

// ========== 실시간 채팅 이벤트 훅 ==========

/**
 * 특정 채팅방의 실시간 이벤트를 처리하는 훅
 */
export const useChatRoomEvents = (roomId: string) => {
  const { onMessage, onRead, onDeleted, onTyping } = useSocketEvents();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // 메시지 수신/읽음/삭제 상태는 useChatMessages 훅에서 처리하므로 제거
  // (중복 리스너 방지)

  // 타이핑 상태 수신 처리만 담당
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

// ========== 채팅 설정 관리 훅 ==========

/**
 * 사용자 채팅 설정 관리 훅
 */
export const useChatSettings = () => {
  const { data, error, isLoading, mutate } = useSWR(
    chatKeys.settings(),
    async () => {
      const response = await expressApi.get("/chat/settings");
      return response.data.data;
    }
  );

  const updateSettings = useCallback(
    async (settings: {
      is_muted?: boolean;
      auto_download_media?: boolean;
    }): Promise<void> => {
      try {
        await expressApi.put("/chat/settings", settings);
        await mutate();
      } catch (error: any) {
        console.error("❌ 채팅 설정 업데이트 실패:", error);
        throw new Error(
          error.response?.data?.message || "설정 업데이트에 실패했습니다."
        );
      }
    },
    [mutate]
  );

  return {
    settings: data,
    isLoading,
    error,
    updateSettings,
  };
};
