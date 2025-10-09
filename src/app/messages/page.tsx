"use client";

import { useState } from "react";
import { UiChatRoom } from "@/types/chat";
import { useChatActions } from "@/hooks/useChat";
import ChatRoomList from "@/app/components/chat/ChatRoomList";
import ChatModal from "@/app/components/modal/chat/ChatModal";

export default function MessagesPage() {
  const [selectedRoom, setSelectedRoom] = useState<UiChatRoom | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const { leaveChatRoom } = useChatActions();

  const handleRoomSelect = (room: UiChatRoom) => {
    setSelectedRoom(room);
    setShowChatModal(true);
  };

  const handleCloseChatModal = () => {
    setShowChatModal(false);
    setSelectedRoom(null);
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

  return (
    <>
      {/* 메인 채팅방 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-[600px]">
        <ChatRoomList
          onRoomSelect={handleRoomSelect}
          selectedRoomId={selectedRoom?.id}
          showSearch={true}
          showNewChatButton={true}
        />
      </div>

      {/* 채팅 모달 */}
      {selectedRoom && (
        <ChatModal
          isOpen={showChatModal}
          onClose={handleCloseChatModal}
          room={selectedRoom}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  );
}
