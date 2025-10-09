"use client";

import { useState, useEffect, useRef } from "react";
import { UiChatRoom } from "@/types/chat";
import {
  useChatMessages,
  useChatActions,
  useChatRoomEvents,
} from "@/hooks/useChat";
import { useSocket, useSocketEvents } from "@/hooks/useSocket";
import { useSession } from "next-auth/react";
import ChatRoomHeader from "@/app/components/chat/ChatRoomHeader";
import ChatMessageItem from "@/app/components/chat/ChatMessageItem";
import ChatInput from "@/app/components/chat/ChatInput";
import TypingIndicator from "@/app/components/chat/TypingIndicator";
import ChatSettingsModal from "./ChatSettingsModal";
import { ChatErrorBoundary } from "@/app/components/common/ErrorBoundary";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: UiChatRoom;
  onLeave?: (roomId: string) => Promise<void>;
}

export default function ChatModal({
  isOpen,
  onClose,
  room,
  onLeave,
}: ChatModalProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  // 검색 필터링된 메시지
  const filteredMessages =
    searchQuery && messages
      ? messages.filter((msg) =>
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : messages;
  const {
    sendMessage,
    joinRoom,
    markAsRead,
    sendTyping,
    deleteMessage,
    isLoading: actionLoading,
  } = useChatActions();
  const { typingUsers } = useChatRoomEvents(room.id);

  const currentUserId = (session?.user as any)?.id;

  // 실시간 메시지 수신 처리
  const { onMessage, onRead, onDeleted } = useSocketEvents();

  useEffect(() => {
    console.log(
      "🔗 [ChatModal] useEffect 실행 - isOpen:",
      isOpen,
      "room.id:",
      room.id
    );

    if (!isOpen || !room.id) {
      console.log(
        "⚠️ [ChatModal] 리스너 등록 건너뜀 (모달 닫힘 또는 room.id 없음)"
      );
      return;
    }

    console.log("✅ [ChatModal] 실시간 리스너 등록:", room.id);

    const unsubscribe = onMessage((data: any) => {
      console.log("📨 [ChatModal] EventBus에서 메시지 수신:", data);
      console.log(
        "📨 [ChatModal] 현재 room.id:",
        room.id,
        "수신 room_id:",
        data.room_id
      );

      if (data.room_id === room.id) {
        console.log("✅ [ChatModal] 해당 채팅방 메시지 -> 캐시 업데이트 시작");

        // SWR 캐시 업데이트
        mutateMessages(
          (currentData: any) => {
            console.log("📋 [ChatModal] 현재 캐시 데이터:", currentData);

            if (!currentData || !Array.isArray(currentData)) {
              console.log("⚠️ [ChatModal] 캐시 데이터 없음 또는 배열 아님");
              return currentData;
            }

            // 중복 체크
            const isDuplicate = currentData.some((page: any) =>
              page?.data?.some((msg: any) => msg.id === data.message.id)
            );

            if (isDuplicate) {
              console.log("⏭️ [ChatModal] 중복 메시지 무시:", data.message.id);
              return currentData;
            }

            console.log("➕ [ChatModal] 새 메시지 추가:", data.message);

            // 첫 페이지에 메시지 추가
            const updatedData = [...currentData];
            if (updatedData[0]?.data) {
              updatedData[0] = {
                ...updatedData[0],
                data: [...updatedData[0].data, data.message],
              };

              console.log(
                "✅ [ChatModal] 캐시 업데이트 완료, 새 데이터:",
                updatedData
              );
            } else {
              console.log("⚠️ [ChatModal] 첫 페이지 데이터 없음");
            }

            return updatedData;
          },
          { revalidate: false } // 서버 재요청 하지 않음
        );

        // 스크롤 이동
        setTimeout(() => scrollToBottom(), 100);
      } else {
        console.log("⏭️ [ChatModal] 다른 채팅방 메시지 무시");
      }
    });

    return () => {
      console.log("🔌 [ChatModal] 리스너 제거:", room.id);
      unsubscribe();
    };
  }, [isOpen, room.id, onMessage, mutateMessages]);

  // 실시간 읽음 상태 수신
  useEffect(() => {
    if (!isOpen || !room.id) return;

    const unsubscribe = onRead((data: any) => {
      console.log("📖 [ChatModal] 읽음 상태 수신:", data);

      if (data.room_id === room.id) {
        mutateMessages(
          (currentData: any) => {
            if (!currentData || !Array.isArray(currentData)) {
              return currentData;
            }

            const updatedData = currentData.map((page: any) => {
              if (!page?.data) return page;

              return {
                ...page,
                data: page.data.map((msg: any) => {
                  if (msg.id === data.message_id) {
                    const existingReadBy = msg.read_by || [];
                    const alreadyRead = existingReadBy.some(
                      (read: any) => read.user_id === data.user_id
                    );

                    if (!alreadyRead) {
                      console.log(
                        "✅ [ChatModal] 읽음 상태 추가:",
                        data.message_id
                      );
                      return {
                        ...msg,
                        read_by: [
                          ...existingReadBy,
                          {
                            message_id: data.message_id,
                            user_id: data.user_id,
                            read_at: data.read_at,
                            user: data.user,
                          },
                        ],
                      };
                    }
                  }
                  return msg;
                }),
              };
            });

            return updatedData;
          },
          { revalidate: false }
        );
      }
    });

    return unsubscribe;
  }, [isOpen, room.id, onRead, mutateMessages]);

  // 실시간 메시지 삭제 수신
  useEffect(() => {
    if (!isOpen || !room.id) return;

    const unsubscribe = onDeleted((data: any) => {
      console.log("🗑️ [ChatModal] 삭제 수신:", data);

      if (data.room_id === room.id) {
        mutateMessages(
          (currentData: any) => {
            if (!currentData || !Array.isArray(currentData)) {
              return currentData;
            }

            return currentData.map((page: any) => {
              if (!page?.data) return page;

              return {
                ...page,
                data: page.data.map((msg: any) => {
                  if (msg.id === data.message_id) {
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
            });
          },
          { revalidate: false }
        );
      }
    });

    return unsubscribe;
  }, [isOpen, room.id, onDeleted, mutateMessages]);

  // 채팅방 참여 및 스크롤 관리
  useEffect(() => {
    if (isOpen && room.id && isConnected) {
      console.log("💬 채팅방 조인:", room.id);
      joinRoom(room.id);
      scrollToBottom();
    }
  }, [isOpen, room.id, isConnected]);

  // 새 메시지 도착 시 스크롤
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [messages]);

  // 채팅방 열림 + 메시지 로드 완료 시 읽음 처리 (모든 안읽은 메시지)
  useEffect(() => {
    if (!isOpen || !room.id || !messages || messages.length === 0) return;
    if (!currentUserId) return;

    // 상대방이 보낸 안읽은 메시지들 찾기
    const unreadMessages = messages.filter((msg) => {
      // 내가 보낸 메시지는 제외
      if (msg.sender_id === currentUserId) return false;

      // 이미 처리한 메시지는 제외
      if (processedMessageIdsRef.current.has(msg.id)) return false;

      // read_by가 없으면 안읽음
      if (!msg.read_by || msg.read_by.length === 0) return true;

      // 내가 읽지 않았으면 안읽음
      const hasRead = msg.read_by.some(
        (read) => read.user_id === currentUserId
      );
      return !hasRead;
    });

    if (unreadMessages.length === 0) return;

    console.log(`📖 ${unreadMessages.length}개의 안읽은 메시지 읽음 처리 시작`);

    // 모든 안읽은 메시지를 읽음 처리
    const markAllAsRead = async () => {
      for (const msg of unreadMessages) {
        try {
          console.log(`📖 메시지 읽음 처리: ${msg.id}`);
          await markAsRead(msg.id, room.id);
          processedMessageIdsRef.current.add(msg.id); // 처리 완료 기록
          console.log(`✅ 메시지 읽음 처리 완료: ${msg.id}`);
        } catch (error) {
          console.error(`❌ 메시지 읽음 처리 실패: ${msg.id}`, error);
        }
      }
      console.log(`✅ 모든 안읽은 메시지 읽음 처리 완료`);
    };

    markAllAsRead();
  }, [isOpen, room.id, messages, currentUserId, markAsRead]);

  // 채팅방이 바뀌면 처리된 메시지 ID 초기화
  useEffect(() => {
    processedMessageIdsRef.current.clear();
  }, [room.id]);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지 전송 처리
  const handleSendMessage = async () => {
    // 메시지도 없고 파일도 없으면 전송하지 않음
    if (!messageInput.trim() && !selectedFile) return;
    if (actionLoading || !isConnected) return;

    const content = messageInput.trim();
    setMessageInput("");

    try {
      // 파일이 선택되어 있으면 먼저 업로드
      if (selectedFile) {
        await handleFileUploadAndSend(selectedFile, content);
      } else {
        // 텍스트만 전송
        await sendMessage(room.id, content);
        await mutateMessages();
      }

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error("❌ 메시지 전송 실패:", error);
      setMessageInput(content);
    }
  };

  // 타이핑 상태 처리
  const handleTyping = (isTyping: boolean) => {
    sendTyping(room.id, isTyping);
  };

  // 이미지 클릭 처리
  const handleImageClick = (imageUrl: string) => {
    window.open(imageUrl, "_blank");
  };

  // 파일 다운로드 처리
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 파일 선택 처리 (바로 전송하지 않고 미리보기만 표시)
  const handleFileSelect = (file: File) => {
    if (!isConnected) {
      alert("연결이 끊겼습니다. 다시 시도해주세요.");
      return;
    }

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    // 파일 저장
    setSelectedFile(file);

    // 이미지 미리보기 생성
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    console.log("📎 파일 선택됨:", file.name, file.size);
  };

  // 파일 업로드 및 전송
  const handleFileUploadAndSend = async (
    file: File,
    messageContent: string
  ) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // uploadChatFile 임포트
      const { uploadChatFile } = await import("@/lib/api/chat");

      console.log("📤 파일 업로드 시작:", file.name, file.size);

      // 파일 업로드
      const result = await uploadChatFile(file, (progress) => {
        setUploadProgress(progress);
        console.log(`📊 업로드 진행률: ${progress}%`);
      });

      console.log("✅ 파일 업로드 완료:", result);

      // 메시지 타입 결정
      const messageType = result.fileType === "image" ? "image" : "file";

      // 메시지와 파일 함께 전송
      const content = messageContent || result.fileName;
      await sendMessage(room.id, content, messageType, {
        file_url: result.fileUrl,
        file_name: result.fileName,
        file_size: result.fileSize,
      });

      await mutateMessages();

      // 파일 선택 초기화
      setSelectedFile(null);
      setFilePreview(null);
    } catch (error: any) {
      console.error("❌ 파일 업로드 실패:", error);

      // 에러 메시지 개선
      let errorMessage = "파일 업로드에 실패했습니다.";

      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        errorMessage =
          "파일 업로드 시간이 초과되었습니다. 파일 크기가 너무 크거나 네트워크가 느릴 수 있습니다.";
      } else if (error.response?.status === 413) {
        errorMessage = "파일이 너무 큽니다. 10MB 이하의 파일을 선택해주세요.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 파일 선택 취소
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // 메시지 삭제 처리
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId, room.id);
      await mutateMessages();
    } catch (error) {
      console.error("❌ 메시지 삭제 실패:", error);
      alert("메시지 삭제에 실패했습니다.");
    }
  };

  // 채팅방 나가기 처리
  const handleLeaveRoom = async (roomId: string) => {
    try {
      if (onLeave) {
        await onLeave(roomId);
        onClose(); // 나가기 성공 후 모달 닫기
      }
    } catch (error) {
      console.error("채팅방 나가기 실패:", error);
      alert("채팅방을 나갈 수 없습니다. 다시 시도해주세요.");
    }
  };

  // 드래그 앤 드롭 처리
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]); // 첫 번째 파일만 선택
    }
  };

  // 배경 클릭 시 모달 닫기
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ChatErrorBoundary>
      <div
        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
        onClick={handleBackgroundClick}
      >
        <div
          className="bg-white dark:bg-gray-800 w-full max-w-md h-[600px] flex flex-col shadow-xl rounded-lg overflow-hidden relative"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* 드래그 오버레이 */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl text-center">
                <div className="text-4xl mb-2">📎</div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  파일을 여기에 드롭하세요
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  이미지, PDF, 문서 파일 (최대 10MB)
                </p>
              </div>
            </div>
          )}

          {/* 헤더 */}
          <ChatRoomHeader
            room={room}
            currentUserId={currentUserId}
            onClose={onClose}
            onSearch={() => setIsSearchOpen(!isSearchOpen)}
            onSettings={() => setIsSettingsOpen(true)}
            onLeave={onLeave ? handleLeaveRoom : undefined}
            isConnected={isConnected}
          />

          {/* Socket 연결 에러 배너 */}
          {!isConnected && (
            <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      연결 끊김
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      재연결 중입니다. 메시지 전송이 지연될 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 메시지 검색 */}
          {isSearchOpen && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="메시지 검색..."
                  className="w-full px-4 py-2 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading && messages.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* 검색 결과 안내 */}
                {searchQuery && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      "{searchQuery}" 검색 결과: {filteredMessages?.length || 0}
                      개
                    </p>
                  </div>
                )}

                {/* 더 로드하기 버튼 */}
                {hasMore && !searchQuery && (
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={loadMore}
                      disabled={isLoading}
                      className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      {isLoading ? "로딩 중..." : "이전 메시지 불러오기"}
                    </button>
                  </div>
                )}

                {/* 메시지 목록 */}
                <div className="space-y-2">
                  {filteredMessages && filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <ChatMessageItem
                        key={message.id}
                        message={message}
                        isOwn={message.sender_id === currentUserId}
                        onImageClick={handleImageClick}
                        onFileDownload={handleFileDownload}
                        onDelete={handleDeleteMessage}
                        totalMemberCount={room.members?.length || 2}
                      />
                    ))
                  ) : searchQuery ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      검색 결과가 없습니다.
                    </div>
                  ) : null}
                </div>

                {/* 타이핑 표시 */}
                <TypingIndicator
                  typingUsers={typingUsers}
                  currentUserId={currentUserId}
                />

                {/* 스크롤 앵커 */}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* 파일 미리보기 */}
          {selectedFile && !isUploading && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center space-x-3">
                {/* 이미지 미리보기 */}
                {filePreview ? (
                  <div className="relative">
                    <img
                      src={filePreview}
                      alt="미리보기"
                      className="w-16 h-16 object-cover rounded"
                    />
                    <button
                      onClick={handleRemoveFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center space-x-2 bg-white dark:bg-gray-800 rounded px-3 py-2">
                    <span className="text-2xl">📎</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={handleRemoveFile}
                      className="ml-2 text-red-500 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round(selectedFile.size / 1024)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 업로드 진행률 표시 */}
          {isUploading && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      파일 업로드 중...
                    </span>
                    <span className="text-sm font-medium text-blue-500">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 메시지 입력 */}
          <ChatInput
            value={messageInput}
            onChange={setMessageInput}
            onSend={handleSendMessage}
            onTyping={handleTyping}
            disabled={!isConnected || isUploading}
            placeholder={
              isUploading
                ? "파일 업로드 중..."
                : selectedFile
                ? "메시지를 입력하고 전송하세요... (선택사항)"
                : "메시지를 입력하세요..."
            }
            showFileUpload={!selectedFile}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* 채팅 설정 모달 */}
        <ChatSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          roomId={room.id}
          otherMemberNickname={
            room.other_member?.user?.nickname ||
            room.other_member?.user?.username ||
            "사용자"
          }
        />
      </div>
    </ChatErrorBoundary>
  );
}
