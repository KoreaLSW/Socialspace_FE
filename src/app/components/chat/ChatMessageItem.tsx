"use client";

import { useState } from "react";
import { ChatMessageItemProps } from "@/types/chat";
import UserAvatar from "@/app/components/common/UserAvatar";
import UserNickName from "@/app/components/common/UserNickName";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Download, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ChatMessageItem({
  message,
  isOwn,
  showSender = true,
  showTime = true,
  onImageClick,
  onFileDownload,
  onDelete,
  totalMemberCount = 2, // 기본값 1:1 채팅
}: ChatMessageItemProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
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

  // 읽지 않은 사람 수 계산
  const getUnreadCount = () => {
    if (!isOwn || !message.read_by) return 0;

    // 읽은 사람 수 (본인 제외)
    const readCount = message.read_by.filter(
      (read) => read.user_id !== currentUserId
    ).length;

    // 전체 멤버 수에서 본인과 읽은 사람을 제외
    const unreadCount = totalMemberCount - 1 - readCount;

    return unreadCount > 0 ? unreadCount : 0;
  };

  const unreadCount = getUnreadCount();

  const handleImageClick = () => {
    if (message.file_url && onImageClick) {
      onImageClick(message.file_url);
    }
  };

  const handleFileDownload = () => {
    if (message.file_url && message.file_name && onFileDownload) {
      onFileDownload(message.file_url, message.file_name);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    // 본인 메시지이고 삭제 기능이 있을 때만
    if (isOwn && onDelete && message.message_type !== "system") {
      e.preventDefault();
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm("이 메시지를 삭제하시겠습니까?")) {
      onDelete(message.id);
    }
    setShowContextMenu(false);
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
        {/* 발송자 정보 (본인 메시지가 아니고 showSender가 true인 경우) */}
        {!isOwn && showSender && message.sender && (
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
          onContextMenu={handleContextMenu}
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
                className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handleImageClick}
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
              <div
                className="flex items-center space-x-2 bg-white/10 rounded p-2 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={handleFileDownload}
              >
                <div className="flex-1">
                  <p className="font-medium">{message.file_name}</p>
                  {message.file_size && (
                    <p className="text-sm opacity-75">
                      {Math.round(message.file_size / 1024)} KB
                    </p>
                  )}
                </div>
                <Download size={16} className="opacity-75" />
              </div>
              {message.content && (
                <p className="mt-2 whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
          )}

          {message.message_type === "system" && (
            <p className="text-center text-sm opacity-75 italic">
              {message.content}
            </p>
          )}
        </div>

        {/* 시간 및 읽음 표시 */}
        <div
          className={`flex items-center gap-1 mt-1 ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          {/* 읽음 표시 (본인 메시지에만 표시) */}
          {isOwn && unreadCount > 0 && (
            <span className="text-xs font-medium text-yellow-500">
              {unreadCount}
            </span>
          )}

          {/* 시간 표시 */}
          {showTime && (
            <p className="text-xs text-gray-500">
              {formatTime(message.created_at)}
            </p>
          )}
        </div>
      </div>

      {/* 컨텍스트 메뉴 (우클릭 메뉴) */}
      {showContextMenu && (
        <>
          {/* 배경 클릭 감지 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowContextMenu(false)}
          />

          {/* 메뉴 */}
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
            }}
          >
            <button
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <Trash2 size={14} />
              <span>메시지 삭제</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
