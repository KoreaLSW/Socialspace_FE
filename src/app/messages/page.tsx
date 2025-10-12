"use client";

import { useState } from "react";
import { UiChatRoom } from "@/types/chat";
import { ChatMessage, ChatRoom } from "@/lib/api/chat";
import { useChatActions } from "@/hooks/useChat";
import ChatRoomList from "@/app/components/chat/ChatRoomList";
import ChatModal from "@/app/components/modal/chat/ChatModal";
import ChatSearchResults from "@/app/components/chat/ChatSearchResults";
import MessageSearchResults from "@/app/components/chat/MessageSearchResults";

export default function MessagesPage() {
  const [selectedRoom, setSelectedRoom] = useState<UiChatRoom | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomForSearch, setSelectedRoomForSearch] =
    useState<UiChatRoom | null>(null);
  const [scrollToMessageId, setScrollToMessageId] = useState<
    string | undefined
  >(undefined);
  const { leaveChatRoom } = useChatActions();

  const handleRoomSelect = (room: UiChatRoom) => {
    setSelectedRoom(room);
    setShowChatModal(true);
  };

  const handleCloseChatModal = () => {
    setShowChatModal(false);
    setSelectedRoom(null);
    setScrollToMessageId(undefined);
    // 검색 관련 상태도 초기화
    setShowSearchResults(false);
    setShowMessageSearch(false);
    setSearchQuery("");
    setSelectedRoomForSearch(null);
  };

  const handleLeaveRoom = async (roomId: string) => {
    try {
      await leaveChatRoom(roomId);
      // 현재 열린 채팅방이 나간 채팅방이면 모달 닫기
      if (selectedRoom?.id === roomId) {
        handleCloseChatModal();
      }
    } catch (error) {
      console.error("채팅방 나가기 실패:", error);
      throw error; // ChatModal에서 에러 처리
    }
  };

  // 검색 관련 핸들러들
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // 검색어가 있을 때 검색 결과 화면 표시 (드롭다운에서 이미 showSearchResults가 true)
    if (query.trim()) {
      setShowSearchResults(true);
    } else if (query.trim().length === 0) {
      setShowSearchResults(false);
    }
  };

  const handleSearchResultRoomSelect = (
    room: ChatRoom & { message_count: number },
    searchQuery: string
  ) => {
    // ChatRoom을 UiChatRoom으로 변환
    const uiRoom: UiChatRoom = {
      ...room,
      members: room.members || [],
      unread_count: 0,
    };

    // 대화방 이름 설정 (그룹 채팅이면 이름, 1:1이면 상대방 이름)
    let roomDisplayName = "대화방";
    if (room.is_group && room.name) {
      roomDisplayName = room.name;
    } else if (!room.is_group && room.members && room.members.length > 0) {
      // 1:1 채팅의 경우 상대방 이름 사용
      const otherMember = room.members.find(
        (member) => member.user_id !== "current_user_id"
      );
      roomDisplayName =
        otherMember?.user?.nickname || otherMember?.user?.username || "대화방";
    }

    uiRoom.name = roomDisplayName;
    console.log("🔍 대화방 선택:", {
      room,
      searchQuery,
      roomDisplayName,
      uiRoom,
    });
    setSelectedRoomForSearch(uiRoom);
    setSearchQuery(searchQuery); // 전달받은 검색어로 설정
    setShowMessageSearch(true);
    setShowSearchResults(false);
  };

  const handleMessageSelect = (message: ChatMessage) => {
    // 해당 메시지가 있는 채팅방으로 이동
    const room = selectedRoomForSearch;
    console.log("메시지 선택:", { message, room, searchQuery });
    if (room) {
      // 먼저 검색 관련 상태 초기화
      setShowSearchResults(false);
      setShowMessageSearch(false);
      setSearchQuery("");
      setSelectedRoomForSearch(null);

      // 약간의 지연 후 채팅 모달 열기 (상태 초기화 완료 후)
      setTimeout(() => {
        setSelectedRoom(room);
        setScrollToMessageId(message.id);
        setShowChatModal(true);
      }, 50);
    }
  };

  const handleBackToSearch = () => {
    setShowMessageSearch(false);
    setShowSearchResults(true);
  };

  const handleCloseSearch = () => {
    setShowSearchResults(false);
    setShowMessageSearch(false);
    setSearchQuery("");
    setSelectedRoomForSearch(null);
  };

  const handleOpenMessageSearch = () => {
    setShowSearchResults(true);
    setSearchQuery(""); // 빈 검색어로 시작
  };

  return (
    <>
      {/* 검색 결과 화면 */}
      {showMessageSearch && selectedRoomForSearch ? (
        <MessageSearchResults
          roomId={selectedRoomForSearch.id}
          roomName={selectedRoomForSearch.name || "대화방"}
          searchQuery={searchQuery}
          onMessageSelect={handleMessageSelect}
          onBack={handleBackToSearch}
          onClose={handleCloseSearch}
        />
      ) : showSearchResults ? (
        <ChatSearchResults
          searchQuery={searchQuery}
          onRoomSelect={handleSearchResultRoomSelect}
          onClose={handleCloseSearch}
        />
      ) : (
        /* 메인 채팅방 목록 */
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-[600px]">
          <ChatRoomList
            onRoomSelect={handleRoomSelect}
            selectedRoomId={selectedRoom?.id}
            showSearch={true}
            showNewChatButton={true}
            onSearch={handleSearch}
            onOpenMessageSearch={handleOpenMessageSearch}
          />
        </div>
      )}

      {/* 채팅 모달 */}
      {selectedRoom && (
        <ChatModal
          isOpen={showChatModal}
          onClose={handleCloseChatModal}
          room={selectedRoom}
          onLeave={handleLeaveRoom}
          scrollToMessageId={scrollToMessageId}
        />
      )}
    </>
  );
}
