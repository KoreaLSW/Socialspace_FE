"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Plus, Search, Users, User } from "lucide-react";
import { UiChatRoom, UserSearchResult } from "@/types/chat";
import { useChatRooms, useChatActions } from "@/hooks/useChat";
import { useSocketEvents } from "@/hooks/useSocket";
import { useCurrentUser } from "@/hooks/useAuth";
import ChatRoomItem from "./ChatRoomItem";
import UserSearch from "./UserSearch";
import CreateGroupChatModal from "@/app/components/modal/chat/CreateGroupChatModal";

interface ChatRoomListProps {
  onRoomSelect: (room: UiChatRoom) => void;
  selectedRoomId?: string;
  showSearch?: boolean;
  showNewChatButton?: boolean;
  className?: string;
  onSearch?: (query: string) => void;
  onOpenMessageSearch?: () => void;
}

export default function ChatRoomList({
  onRoomSelect,
  selectedRoomId,
  showSearch = true,
  showNewChatButton = true,
  className = "",
  onSearch,
  onOpenMessageSearch,
}: ChatRoomListProps) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useCurrentUser();
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNewChatMenu, setShowNewChatMenu] = useState(false);
  const [showRoomSearch, setShowRoomSearch] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const currentUserId = user?.id;

  const {
    rooms,
    totalCount,
    isLoading,
    error,
    mutate: mutateRooms,
  } = useChatRooms(page, 20, roomSearchQuery);

  const {
    createOrGetChatRoom,
    leaveChatRoom,
    isLoading: creatingRoom,
  } = useChatActions();

  const { onMessage, onRead, onAllRead } = useSocketEvents();

  // 검색어가 변경되면 페이지를 1로 리셋
  useEffect(() => {
    setPage(1);
  }, [roomSearchQuery]);

  // 실시간 메시지 수신 시 채팅방 목록 업데이트
  useEffect(() => {
    const unsubscribe = onMessage((data: any) => {
      console.log("📨 [ChatRoomList] 새 메시지 수신:", data);

      const { room_id, message } = data;

      // 낙관적 업데이트: 로컬 캐시에 즉시 반영
      mutateRooms(
        (currentData: any) => {
          if (!currentData || !currentData.data) return currentData;

          // 채팅방이 목록에 있는지 확인
          const roomExists = currentData.data.some(
            (room: any) => room.id === room_id
          );

          // 새로운 채팅방이면 서버에서 다시 불러오기
          if (!roomExists) {
            console.log(
              "🆕 [ChatRoomList] 새로운 채팅방 감지 - 목록 새로고침:",
              room_id
            );
            // revalidate: true로 서버에서 최신 데이터를 가져옴
            return currentData;
          }

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
        { revalidate: false } // 기존 채팅방은 캐시만 업데이트
      );

      // 새로운 채팅방인 경우 서버에서 다시 불러오기
      mutateRooms(
        (currentData: any) => {
          if (!currentData || !currentData.data) return currentData;
          const roomExists = currentData.data.some(
            (room: any) => room.id === room_id
          );
          if (!roomExists) {
            // 새 채팅방이면 undefined 반환하여 서버에서 다시 가져오게 함
            return undefined;
          }
          return currentData;
        },
        { revalidate: true }
      );
    });

    return unsubscribe;
  }, [onMessage, mutateRooms, currentUserId]);

  // 실시간 읽음 상태 수신 시 채팅방 목록 업데이트
  useEffect(() => {
    const unsubscribe = onRead((data: any) => {
      console.log("📖 [ChatRoomList] 읽음 상태 수신:", data);

      const { room_id, user_id } = data;

      // 내가 메시지를 읽은 경우에만 해당 채팅방의 unread_count를 0으로 설정
      if (user_id === currentUserId) {
        mutateRooms(
          (currentData: any) => {
            if (!currentData || !currentData.data) return currentData;

            const updatedRooms = currentData.data.map((room: any) => {
              if (room.id === room_id) {
                console.log(
                  `📖 [ChatRoomList] 내가 읽음 - unread_count 초기화: ${room.id} (${room.unread_count} → 0)`
                );
                return {
                  ...room,
                  unread_count: 0,
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
      } else {
        // 상대방이 메시지를 읽은 경우는 UI에 영향 없음 (읽음 표시만 업데이트)
        console.log(
          `📖 [ChatRoomList] 상대방이 읽음 - 읽음 표시만 업데이트 (unread_count 변경 없음)`
        );
      }
    });

    return unsubscribe;
  }, [onRead, mutateRooms, currentUserId]);

  // 실시간 전체 읽음 상태 수신 시 채팅방 목록 업데이트
  useEffect(() => {
    const unsubscribe = onAllRead((data: any) => {
      console.log("📖 [ChatRoomList] 전체 읽음 상태 수신:", data);

      const { room_id, user_id } = data;

      // 내가 모든 메시지를 읽은 경우 해당 채팅방의 unread_count를 0으로 설정
      if (user_id === currentUserId) {
        mutateRooms(
          (currentData: any) => {
            if (!currentData || !currentData.data) return currentData;

            const updatedRooms = currentData.data.map((room: any) => {
              if (room.id === room_id) {
                console.log(
                  `📖 [ChatRoomList] 내가 모든 메시지 읽음 - unread_count 초기화: ${room.id} (${room.unread_count} → 0)`
                );
                return {
                  ...room,
                  unread_count: 0,
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
    });

    return unsubscribe;
  }, [onAllRead, mutateRooms, currentUserId]);

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

  // 인증 로딩 중이면 로딩 표시
  if (isAuthLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 인증되지 않았으면 메시지 표시
  if (!isAuthenticated || !currentUserId) {
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
            <div className="relative">
              <button
                onClick={() => setShowNewChatMenu(!showNewChatMenu)}
                disabled={creatingRoom}
                className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full transition-colors"
                title="새 채팅"
              >
                <Plus size={20} />
              </button>

              {/* 드롭다운 메뉴 */}
              {showNewChatMenu && (
                <>
                  {/* 배경 클릭 감지 */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowNewChatMenu(false)}
                  />

                  {/* 메뉴 */}
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-[180px]">
                    <button
                      onClick={() => {
                        setShowNewChatMenu(false);
                        if (onOpenMessageSearch) {
                          onOpenMessageSearch();
                        } else {
                          setShowRoomSearch(true);
                        }
                        setShowUserSearch(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Search size={16} />
                      <span>대화 검색</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowNewChatMenu(false);
                        setShowUserSearch(true);
                        setShowRoomSearch(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <User size={16} />
                      <span>1:1 채팅 시작</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowNewChatMenu(false);
                        setShowGroupModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Users size={16} />
                      <span>그룹 채팅 만들기</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 검색 또는 사용자 검색 */}
        {showSearch && (showUserSearch || showRoomSearch) && (
          <div className="space-y-3">
            {showUserSearch && (
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
            )}
            {showRoomSearch && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    대화 검색
                  </span>
                  <button
                    onClick={() => {
                      setShowRoomSearch(false);
                      setRoomSearchQuery("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    취소
                  </button>
                </div>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={roomSearchQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setRoomSearchQuery(query);
                      // 메시지 검색 기능 호출
                      if (onSearch && query.trim()) {
                        onSearch(query);
                      }
                    }}
                    placeholder="대화 검색..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full outline-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
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
            {roomSearchQuery.trim() ? (
              <>
                <Search className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  &quot;{roomSearchQuery}&quot;에 대한 검색 결과가 없습니다.
                </p>
                <button
                  onClick={() => setRoomSearchQuery("")}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  검색어 지우기
                </button>
              </>
            ) : (
              <>
                <MessageCircle
                  className="mx-auto mb-4 text-gray-400"
                  size={48}
                />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  아직 채팅이 없습니다.
                </p>
                {showNewChatButton && (
                  <button
                    onClick={() => setShowNewChatMenu(true)}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    새 채팅 시작하기
                  </button>
                )}
              </>
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

      {/* 그룹 채팅 생성 모달 */}
      <CreateGroupChatModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={(room) => {
          console.log("그룹 생성 완료:", room);
          onRoomSelect(room);
          mutateRooms(); // 채팅방 목록 갱신
        }}
        currentUserId={currentUserId}
      />
    </div>
  );
}
