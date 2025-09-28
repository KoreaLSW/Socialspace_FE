"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { ChatRoom, ChatMessage } from "@/lib/api/chat";
import {
  useChatMessages,
  useChatActions,
  useChatRoomEvents,
} from "@/hooks/useChat";
import { useSocket, useSocketEvents } from "@/hooks/useSocket";
import { useSession } from "next-auth/react";
import UserAvatar from "@/app/components/common/UserAvatar";
import UserNickName from "@/app/components/common/UserNickName";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: ChatRoom;
}

export default function ChatModal({ isOpen, onClose, room }: ChatModalProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { data: session } = useSession();
  const { isConnected } = useSocket();
  const {
    messages,
    isLoading,
    loadMore,
    hasMore,
    mutate: mutateMessages,
  } = useChatMessages(room.id);
  const {
    sendMessage,
    joinRoom,
    markAsRead,
    sendTyping,
    isLoading: actionLoading,
  } = useChatActions();
  const { typingUsers } = useChatRoomEvents(room.id);
  console.log("💬! messages:", messages);

  // 실시간 메시지 수신 처리 강화
  const { onMessage } = useSocketEvents();
  useEffect(() => {
    if (!isOpen || !room.id) return;

    const unsubscribe = onMessage((data: any) => {
      console.log("💬 ChatModal - 실시간 메시지 수신:", data);
      if (data.room_id === room.id) {
        console.log("✅ ChatModal - 해당 방 메시지 수신, 강제 갱신");
        // 메시지 목록 강제 갱신
        mutateMessages();

        // 실시간 메시지 수신 시 스크롤 이동
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    });

    return unsubscribe;
  }, [isOpen, room.id, onMessage, mutateMessages]);
  // 현재 사용자 ID
  const currentUserId = (session?.user as any)?.id;

  // 채팅방 참여 및 스크롤 관리
  useEffect(() => {
    if (isOpen && room.id && isConnected) {
      console.log("💬 채팅방 조인:", room.id);
      joinRoom(room.id);
      scrollToBottom();
    }
  }, [isOpen, room.id, isConnected]); // joinRoom 의존성 제거로 무한 루프 방지

  // 새 메시지 도착 시 스크롤
  useEffect(() => {
    if (messages && messages.length > 0) {
      console.log("📜 메시지 변경 감지, 스크롤 이동:", messages.length);
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [messages]);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지 전송 처리
  const handleSendMessage = async () => {
    if (!messageInput.trim() || actionLoading || !isConnected) return;

    const content = messageInput.trim();
    setMessageInput("");

    // 타이핑 상태 중지
    if (isTyping) {
      sendTyping(room.id, false);
      setIsTyping(false);
    }

    try {
      console.log("💬 메시지 전송 시도:", content);
      const sentMessage = await sendMessage(room.id, content);
      console.log("✅ 메시지 전송 성공:", sentMessage);

      // 강제로 메시지 목록 갱신
      console.log("🔄 메시지 목록 강제 갱신");
      await mutateMessages();

      // 메시지 전송 후 즉시 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 50);

      // 추가 스크롤 보장 (갱신 후)
      setTimeout(() => {
        scrollToBottom();
      }, 300);

      inputRef.current?.focus();
    } catch (error) {
      console.error("❌ 메시지 전송 실패:", error);
      // 실패 시 메시지 복원
      setMessageInput(content);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 타이핑 상태 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // 타이핑 상태 전송
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTyping(room.id, true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      sendTyping(room.id, false);
    }

    // 타이핑 상태 자동 종료 타이머
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTyping(room.id, false);
      }
    }, 3000);
  };

  // 모달 닫기 시 정리
  const handleClose = () => {
    if (isTyping) {
      sendTyping(room.id, false);
      setIsTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setMessageInput("");
    onClose();
  };

  // 배경 클릭 시 모달 닫기
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // 상대방 정보 (1:1 채팅인 경우)
  const otherMember = room.members?.find(
    (member) => member.user_id !== room.id
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-md h-[600px] flex flex-col shadow-xl rounded-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageCircle className="text-blue-500" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {room.is_group ? room.name || "그룹 채팅" : "채팅"}
              </h2>
              {!room.is_group && otherMember && (
                <p className="text-sm text-gray-500">
                  {otherMember.user?.nickname || otherMember.user?.username}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* 연결 상태 표시 */}
        {!isConnected && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              연결 중... 메시지 전송이 지연될 수 있습니다.
            </p>
          </div>
        )}

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && messages.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* 더 로드하기 버튼 */}
              {hasMore && (
                <div className="flex justify-center">
                  <button
                    onClick={loadMore}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    이전 메시지 불러오기
                  </button>
                </div>
              )}

              {/* 메시지 목록 */}
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === currentUserId}
                />
              ))}

              {/* 타이핑 표시 */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-gray-500 text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span>입력 중...</span>
                </div>
              )}

              {/* 스크롤 앵커 */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 메시지 입력 */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end space-x-2">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white max-h-20"
              rows={1}
              disabled={!isConnected}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || actionLoading || !isConnected}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 개별 메시지 컴포넌트
interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
}

function MessageItem({ message, isOwn }: MessageItemProps) {
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko,
      });
    } catch {
      return "";
    }
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
        {/* 발송자 정보 (본인 메시지가 아닌 경우) */}
        {!isOwn && message.sender && (
          <div className="flex items-center space-x-2 mb-1">
            <UserAvatar
              src={message.sender.profile_image}
              alt={message.sender.nickname || "사용자"}
              size={24}
            />
            <UserNickName
              name={message.sender.nickname || ""}
              username={message.sender.username || ""}
              className="text-sm text-gray-600 dark:text-gray-400"
            />
          </div>
        )}

        {/* 메시지 내용 */}
        <div
          className={`rounded-lg px-3 py-2 ${
            isOwn
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          }`}
        >
          {/* 메시지 타입별 렌더링 */}
          {message.message_type === "text" && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {message.message_type === "image" && (
            <div>
              <img
                src={message.file_url}
                alt="첨부 이미지"
                className="max-w-full rounded"
              />
              {message.content && (
                <p className="mt-2 whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
          )}

          {message.message_type === "file" && (
            <div>
              <div className="flex items-center space-x-2 bg-white/10 rounded p-2">
                <div className="flex-1">
                  <p className="font-medium">{message.file_name}</p>
                  {message.file_size && (
                    <p className="text-sm opacity-75">
                      {Math.round(message.file_size / 1024)} KB
                    </p>
                  )}
                </div>
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-200 hover:text-white"
                >
                  다운로드
                </a>
              </div>
              {message.content && (
                <p className="mt-2 whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 시간 표시 */}
        <p
          className={`text-xs text-gray-500 mt-1 ${
            isOwn ? "text-right" : "text-left"
          }`}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
