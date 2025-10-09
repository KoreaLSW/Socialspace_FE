"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Plus, Search } from "lucide-react";
import { UiChatRoom, UserSearchResult } from "@/types/chat";
import { useChatRooms, useChatActions } from "@/hooks/useChat";
import { useSocketEvents } from "@/hooks/useSocket";
import { useSession } from "next-auth/react";
import ChatRoomItem from "./ChatRoomItem";
import UserSearch from "./UserSearch";

interface ChatRoomListProps {
  onRoomSelect: (room: UiChatRoom) => void;
  selectedRoomId?: string;
  showSearch?: boolean;
  showNewChatButton?: boolean;
  className?: string;
}

export default function ChatRoomList({
  onRoomSelect,
  selectedRoomId,
  showSearch = true,
  showNewChatButton = true,
  className = "",
}: ChatRoomListProps) {
  const { data: session } = useSession();
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [page, setPage] = useState(1);

  const currentUserId = (session?.user as any)?.id;

  const {
    rooms,
    totalCount,
    isLoading,
    error,
    mutate: mutateRooms,
  } = useChatRooms(page, 20);

  const {
    createOrGetChatRoom,
    leaveChatRoom,
    isLoading: creatingRoom,
  } = useChatActions();

  const { onMessage, onRead } = useSocketEvents();

  // 실시간 메시지 수신 시 채팅방 목록 업데이트
  useEffect(() => {
    const unsubscribe = onMessage((data: any) => {
      console.log("📨 [ChatRoomList] 새 메시지 수신:", data);

      const { room_id, message } = data;

      // 낙관적 업데이트: 로컬 캐시에 즉시 반영
      mutateRooms(
        (currentData: any) => {
          if (!currentData || !currentData.data) return currentData;

          const updatedRooms = currentData.data.map((room: any) => {
            if (room.id === room_id) {
              // 해당 채팅방의 마지막 메시지와 시간 업데이트
              return {
                ...room,
                last_message: message,
                last_message_at: message.created_at,
                // 현재 사용자가 보낸 메시지가 아니면 unread_count 증가
                unread_count:
                  message.sender_id !== currentUserId
                    ? (room.unread_count || 0) + 1
                    : room.unread_count || 0,
              };
            }
            return room;
          });

          // 최신 메시지가 있는 채팅방을 맨 위로 정렬
          updatedRooms.sort((a: any, b: any) => {
            const dateA = new Date(a.last_message_at || 0).getTime();
            const dateB = new Date(b.last_message_at || 0).getTime();
            return dateB - dateA;
          });

          return {
            ...currentData,
            data: updatedRooms,
          };
        },
        { revalidate: false } // 서버 재요청 없이 캐시만 업데이트
      );
    });

    return unsubscribe;
  }, [onMessage, mutateRooms, currentUserId]);

  // 실시간 읽음 상태 수신 시 채팅방 목록 업데이트
  useEffect(() => {
    const unsubscribe = onRead((data: any) => {
      console.log("📖 [ChatRoomList] 읽음 상태 수신:", data);

      const { room_id, user_id } = data;

      // 상대방이 내 메시지를 읽은 경우에만 처리
      if (user_id !== currentUserId) {
        // 해당 채팅방의 unread_count 재조회 (정확한 값을 위해)
        mutateRooms();
      }
    });

    return unsubscribe;
  }, [onRead, mutateRooms, currentUserId]);

  // 채팅방 데이터를 UiChatRoom 형태로 변환
  const uiRooms: UiChatRoom[] = rooms.map((room) => ({
    ...room,
    other_member: room.members?.find(
      (member) => member.user_id !== currentUserId
    ),
  }));

  // 새 채팅 시작
  const handleStartNewChat = async (user: UserSearchResult) => {
    try {
      const room = await createOrGetChatRoom(user.id);
      const uiRoom: UiChatRoom = {
        ...room,
        other_member: {
          room_id: room.id,
          user_id: user.id,
          joined_at: new Date().toISOString(),
          role: "member" as const,
          is_muted: false,
          last_read_at: new Date().toISOString(),
          user: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            profile_image: user.profileImage,
          },
        },
      };

      onRoomSelect(uiRoom);
      setShowUserSearch(false);

      // 채팅방 목록 갱신
      await mutateRooms();
    } catch (error) {
      console.error("새 채팅 시작 실패:", error);
      alert("채팅을 시작할 수 없습니다. 다시 시도해주세요.");
    }
  };

  // 채팅방 나가기
  const handleLeaveRoom = async (roomId: string) => {
    try {
      // 낙관적 업데이트: 즉시 로컬 상태에서 제거
      const optimisticUpdate = () => {
        mutateRooms(
          (currentData: any) => {
            if (!currentData) return currentData;

            const filteredRooms = currentData.data.filter(
              (room: any) => room.id !== roomId
            );
            console.log(
              `🔄 ChatRoomList: 채팅방 제거 ${currentData.data.length} → ${filteredRooms.length}`
            );

            return {
              ...currentData,
              data: filteredRooms,
              pagination: {
                ...currentData.pagination,
                total: Math.max(0, currentData.pagination.total - 1),
              },
            };
          },
          { revalidate: false }
        );
      };

      await leaveChatRoom(roomId, optimisticUpdate);
      console.log("✅ 채팅방 나가기 성공:", roomId);
    } catch (error) {
      console.error("❌ 채팅방 나가기 실패:", error);
      // 실패 시 데이터 다시 불러오기
      mutateRooms();
      alert("채팅방을 나갈 수 없습니다. 다시 시도해주세요.");
    }
  };

  if (!currentUserId) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            메시지
          </h1>
          {showNewChatButton && (
            <button
              onClick={() => setShowUserSearch(!showUserSearch)}
              disabled={creatingRoom}
              className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full transition-colors"
              title="새 채팅 시작"
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {/* 검색 또는 사용자 검색 */}
        {showSearch && (
          <div className="space-y-3">
            {showUserSearch ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    새 채팅 시작
                  </span>
                  <button
                    onClick={() => setShowUserSearch(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    취소
                  </button>
                </div>
                <UserSearch
                  onUserSelect={handleStartNewChat}
                  placeholder="사용자를 검색해서 채팅을 시작하세요..."
                  excludeUserIds={[currentUserId]}
                />
              </div>
            ) : (
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="대화 검색..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full outline-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 채팅방 목록 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && uiRooms.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-red-500">
              채팅방 목록을 불러오는데 실패했습니다.
            </p>
          </div>
        ) : uiRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <MessageCircle className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              아직 채팅이 없습니다.
            </p>
            {showNewChatButton && (
              <button
                onClick={() => setShowUserSearch(true)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                새 채팅 시작하기
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {uiRooms.map((room) => (
              <ChatRoomItem
                key={room.id}
                room={room}
                currentUserId={currentUserId}
                onClick={onRoomSelect}
                onLeave={handleLeaveRoom}
                showUnreadCount={true}
                showLastMessage={true}
                showAvatar={true}
              />
            ))}
          </div>
        )}

        {/* 더 로드하기 (무한 스크롤 대신 버튼으로 구현) */}
        {uiRooms.length < totalCount && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setPage(page + 1)}
              disabled={isLoading}
              className="w-full py-2 text-blue-500 hover:text-blue-600 disabled:text-gray-400 text-sm font-medium"
            >
              {isLoading ? "로딩 중..." : "더 보기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
