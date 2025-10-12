"use client";

import { useState, useEffect, useRef } from "react";
import { mutate } from "swr";
import { UiChatRoom } from "@/types/chat";
import {
  useChatMessages,
  useChatActions,
  useChatRoomEvents,
} from "@/hooks/useChat";
import { useSocket, useSocketEvents } from "@/hooks/useSocket";
import { useSession } from "next-auth/react";
import ChatRoomHeader from "@/app/components/chat/ChatRoomHeader";
import ChatInput from "@/app/components/chat/ChatInput";
import ChatSettingsModal from "./ChatSettingsModal";
import InviteMembersModal from "./InviteMembersModal";
import { ChatErrorBoundary } from "@/app/components/common/ErrorBoundary";
import DragOverlay from "@/app/components/chat/DragOverlay";
import ConnectionStatusBanner from "@/app/components/chat/ConnectionStatusBanner";
import MessageSearch from "@/app/components/chat/MessageSearch";
import MessageList from "@/app/components/chat/MessageList";
import FilePreview from "@/app/components/chat/FilePreview";
import UploadProgress from "@/app/components/chat/UploadProgress";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  const [messageInput, setMessageInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

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
    markAllAsRead,
    sendTyping,
    deleteMessage,
    isLoading: actionLoading,
  } = useChatActions();

  const { typingUsers } = useChatRoomEvents(room.id);

  const currentUserId = (session?.user as any)?.id;

  // 실시간 메시지 수신 처리
  const { onMessage, onRead, onDeleted } = useSocketEvents();

  useEffect(() => {
    if (!isOpen || !room.id) {
      return;
    }

    const unsubscribe = onMessage((data: any) => {
      if (data.room_id === room.id) {
        // SWR 캐시 업데이트
        mutateMessages(
          (currentData: any) => {
            if (!currentData || !Array.isArray(currentData)) {
              return currentData;
            }

            // 중복 체크
            const isDuplicate = currentData.some((page: any) =>
              page?.data?.some((msg: any) => msg.id === data.message.id)
            );

            if (isDuplicate) {
              return currentData;
            }

            // 첫 페이지에 메시지 추가
            const updatedData = [...currentData];
            if (updatedData[0]?.data) {
              updatedData[0] = {
                ...updatedData[0],
                data: [...updatedData[0].data, data.message],
              };
            }

            return updatedData;
          },
          { revalidate: false } // 서버 재요청 하지 않음
        );

        // 상대방이 보낸 메시지라면 자동으로 읽음 처리
        if (data.message.sender_id !== currentUserId) {
          setTimeout(async () => {
            try {
              await markAsRead(data.message.id, room.id);
            } catch (error) {
              console.error("❌ [ChatModal] 자동 읽음 처리 실패:", error);
            }
          }, 100);
        }

        // 스크롤 이동
        setTimeout(() => scrollToBottom(), 100);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, room.id, onMessage, mutateMessages, currentUserId, markAsRead]);

  // 실시간 읽음 상태 수신
  useEffect(() => {
    if (!isOpen || !room.id) return;

    const unsubscribe = onRead((data: any) => {
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
      joinRoom(room.id);
      scrollToBottom();

      // 채팅방 열었을 때 즉시 unread_count를 0으로 설정 (낙관적 업데이트)
      mutate(
        (key: any) =>
          Array.isArray(key) && key[0] === "chat" && key[1] === "rooms",
        (currentData: any) => {
          if (!currentData || !currentData.data) return currentData;

          const updatedRooms = currentData.data.map((r: any) => {
            if (r.id === room.id) {
              return {
                ...r,
                unread_count: 0,
              };
            }
            return r;
          });

          return {
            ...currentData,
            data: updatedRooms,
          };
        },
        { revalidate: false }
      );

      // 백엔드에서도 읽음 처리 (비동기)
      setTimeout(async () => {
        try {
          await markAllAsRead(room.id);
        } catch (error) {
          // 에러 무시
        }
      }, 100);
    }
  }, [isOpen, room.id, isConnected, markAllAsRead]);

  // 새 메시지 도착 시 스크롤
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [messages]);

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

      // 파일 업로드
      const result = await uploadChatFile(file, (progress) => {
        setUploadProgress(progress);
      });

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
          <DragOverlay isDragging={isDragging} />

          {/* 헤더 */}
          <ChatRoomHeader
            room={room}
            currentUserId={currentUserId}
            onClose={onClose}
            onSearch={() => setIsSearchOpen(!isSearchOpen)}
            onInvite={() => setIsInviteOpen(true)}
            onSettings={() => setIsSettingsOpen(true)}
            onLeave={onLeave ? handleLeaveRoom : undefined}
            isConnected={isConnected}
          />

          {/* Socket 연결 에러 배너 */}
          <ConnectionStatusBanner isConnected={isConnected} />

          {/* 메시지 검색 */}
          <MessageSearch
            isOpen={isSearchOpen}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery("")}
          />

          {/* 메시지 목록 */}
          <MessageList
            messages={messages}
            filteredMessages={filteredMessages}
            isLoading={isLoading}
            hasMore={hasMore}
            searchQuery={searchQuery}
            currentUserId={currentUserId}
            roomMembersCount={room.members?.length || 2}
            typingUsers={typingUsers}
            messagesEndRef={messagesEndRef}
            onLoadMore={loadMore}
            onImageClick={handleImageClick}
            onFileDownload={handleFileDownload}
            onDeleteMessage={handleDeleteMessage}
          />

          {/* 파일 미리보기 */}
          <FilePreview
            selectedFile={selectedFile}
            filePreview={filePreview}
            isUploading={isUploading}
            onRemoveFile={handleRemoveFile}
          />

          {/* 업로드 진행률 표시 */}
          <UploadProgress
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />

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

        {/* 멤버 초대 모달 */}
        {room.is_group && (
          <InviteMembersModal
            isOpen={isInviteOpen}
            onClose={() => setIsInviteOpen(false)}
            roomId={room.id}
            currentMembers={room.members?.map((m) => m.user_id) || []}
          />
        )}
      </div>
    </ChatErrorBoundary>
  );
}
