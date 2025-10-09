"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { MoreHorizontal, UserMinus } from "lucide-react";
import { useState } from "react";
import { ChatRoomItemProps } from "@/types/chat";
import UserAvatar from "@/app/components/common/UserAvatar";
import UnreadBadge from "./UnreadBadge";

export default function ChatRoomItem({
  room,
  currentUserId,
  onClick,
  onLeave,
  showUnreadCount = true,
  showLastMessage = true,
  showAvatar = true,
}: ChatRoomItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  // 상대방 정보 (1:1 채팅용)
  const otherMember = room.members?.find(
    (member) => member.user_id !== currentUserId
  );

  // 채팅방 제목
  const getRoomTitle = () => {
    if (room.is_group) {
      return room.name || "그룹 채팅";
    }
    return (
      otherMember?.user?.nickname ||
      otherMember?.user?.username ||
      "알 수 없는 사용자"
    );
  };

  // 마지막 메시지 표시
  const getLastMessageDisplay = () => {
    if (!room.last_message) return "메시지가 없습니다";

    const { message_type, content, sender } = room.last_message;
    const isOwn = sender?.id === currentUserId;
    const senderName = isOwn
      ? "나"
      : sender?.nickname || sender?.username || "";

    switch (message_type) {
      case "image":
        return `${senderName}: 📷 이미지`;
      case "file":
        return `${senderName}: 📎 파일`;
      case "system":
        return content;
      default:
        return `${senderName}: ${content}`;
    }
  };

  // 시간 포맷
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } else if (diffInHours < 24 * 7) {
        return formatDistanceToNow(date, { addSuffix: true, locale: ko });
      } else {
        return date.toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        });
      }
    } catch {
      return "";
    }
  };

  const handleClick = () => {
    onClick(room);
  };

  const handleLeave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLeave && confirm("정말로 이 채팅방을 나가시겠습니까?")) {
      try {
        await onLeave(room.id);
      } catch (error) {
        // 에러는 상위 컴포넌트에서 처리
      }
    }
    setShowMenu(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      className="relative p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        {/* 아바타 */}
        {showAvatar && (
          <div className="relative flex-shrink-0">
            {room.is_group ? (
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {room.name ? room.name[0].toUpperCase() : "G"}
                </span>
              </div>
            ) : (
              <UserAvatar
                src={otherMember?.user?.profile_image}
                alt={otherMember?.user?.nickname || otherMember?.user?.username}
                size={48}
              />
            )}

            {/* 온라인 상태 표시 (향후 구현) */}
            {!room.is_group && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
            )}
          </div>
        )}

        {/* 채팅방 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {getRoomTitle()}
            </h3>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* 시간 */}
              {room.last_message_at && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(room.last_message_at.toString())}
                </span>
              )}

              {/* 안읽은 메시지 배지 */}
              {showUnreadCount && room.unread_count && (
                <UnreadBadge count={room.unread_count} />
              )}
            </div>
          </div>

          {/* 마지막 메시지 */}
          {showLastMessage && (
            <p
              className={`text-sm truncate ${
                room.unread_count && room.unread_count > 0
                  ? "text-gray-900 dark:text-white font-medium"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {getLastMessageDisplay()}
            </p>
          )}
        </div>

        {/* 메뉴 버튼 */}
        {onLeave && (
          <div className="relative flex-shrink-0">
            <button
              onClick={handleMenuToggle}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>

            {/* 드롭다운 메뉴 */}
            {showMenu && (
              <>
                {/* 배경 클릭 감지용 오버레이 */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                {/* 메뉴 */}
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-[120px]">
                  <button
                    onClick={handleLeave}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <UserMinus size={14} />
                    <span>채팅방 나가기</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
