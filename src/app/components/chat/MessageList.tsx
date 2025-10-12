import { RefObject } from "react";
import ChatMessageItem from "./ChatMessageItem";
import TypingIndicator from "./TypingIndicator";
import { ChatMessage } from "@/lib/api/chat";

interface MessageListProps {
  messages: ChatMessage[];
  filteredMessages: ChatMessage[];
  isLoading: boolean;
  hasMore: boolean;
  searchQuery: string;
  currentUserId: string;
  roomMembersCount: number;
  typingUsers: any[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
  onImageClick: (imageUrl: string) => void;
  onFileDownload: (fileUrl: string, fileName: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

export default function MessageList({
  messages,
  filteredMessages,
  isLoading,
  hasMore,
  searchQuery,
  currentUserId,
  roomMembersCount,
  typingUsers,
  messagesEndRef,
  onLoadMore,
  onImageClick,
  onFileDownload,
  onDeleteMessage,
}: MessageListProps) {
  return (
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
                "{searchQuery}" 검색 결과: {filteredMessages?.length || 0}개
              </p>
            </div>
          )}

          {/* 더 로드하기 버튼 */}
          {hasMore && !searchQuery && (
            <div className="flex justify-center mb-4">
              <button
                onClick={onLoadMore}
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
                <div
                  key={message.id}
                  id={`message-${message.id}`}
                  className="transition-colors duration-200"
                >
                  <ChatMessageItem
                    message={message}
                    isOwn={message.sender_id === currentUserId}
                    onImageClick={onImageClick}
                    onFileDownload={onFileDownload}
                    onDelete={onDeleteMessage}
                    totalMemberCount={roomMembersCount}
                  />
                </div>
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
  );
}
