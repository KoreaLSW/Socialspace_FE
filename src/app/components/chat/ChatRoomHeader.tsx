"use client";

import { useState } from "react";
import {
  X,
  Settings,
  MessageCircle,
  Wifi,
  WifiOff,
  MoreVertical,
  UserMinus,
  Search,
  UserPlus,
} from "lucide-react";
import { ChatRoomHeaderProps } from "@/types/chat";
import UserAvatar from "@/app/components/common/UserAvatar";

export default function ChatRoomHeader({
  room,
  currentUserId,
  onClose,
  onSettings,
  onSearch,
  onInvite,
  onLeave,
  showOnlineStatus = false,
  isConnected = true,
}: ChatRoomHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  // 1:1 채팅에서 상대방 정보 가져오기
  const otherMember = room.members?.find(
    (member) => member.user_id !== currentUserId
  );

  const getRoomTitle = () => {
    if (room.is_group) {
      return room.name || "그룹 채팅";
    }
    return otherMember?.user?.nickname || otherMember?.user?.username || "채팅";
  };

  const getRoomSubtitle = () => {
    if (room.is_group) {
      const memberCount = room.members?.length || 0;
      return `${memberCount}명`;
    }

    if (showOnlineStatus && otherMember) {
      // TODO: 실제 온라인 상태 표시 로직 구현
      return "온라인"; // 임시
    }

    return null;
  };

  const handleLeave = async () => {
    if (
      onLeave &&
      confirm(
        "정말로 이 채팅방을 나가시겠습니까?\n나가면 대화 내역이 삭제됩니다."
      )
    ) {
      try {
        await onLeave(room.id);
      } catch (error) {
        // 에러는 상위 컴포넌트에서 처리
      }
    }
    setShowMenu(false);
  };

  return (
    <>
      {/* 메인 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* 아바타 */}
          {!room.is_group && otherMember?.user && (
            <UserAvatar
              src={otherMember.user.profile_image}
              alt={otherMember.user.nickname || otherMember.user.username}
              size={40}
            />
          )}

          {room.is_group && (
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <MessageCircle className="text-white" size={20} />
            </div>
          )}

          {/* 제목 및 부제목 */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {getRoomTitle()}
            </h2>
            {getRoomSubtitle() && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getRoomSubtitle()}
              </p>
            )}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-2">
          {/* 검색 버튼 */}
          {onSearch && (
            <button
              onClick={onSearch}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="메시지 검색"
            >
              <Search size={18} />
            </button>
          )}

          {/* 메뉴 버튼 (설정, 나가기 등) */}
          {(onSettings || onLeave) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="메뉴"
              >
                <MoreVertical size={18} />
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
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-[160px]">
                    {room.is_group && onInvite && (
                      <button
                        onClick={() => {
                          onInvite();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <UserPlus size={14} />
                        <span>멤버 초대</span>
                      </button>
                    )}

                    {onSettings && (
                      <button
                        onClick={() => {
                          onSettings();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Settings size={14} />
                        <span>채팅방 설정</span>
                      </button>
                    )}

                    {onLeave && (
                      <button
                        onClick={handleLeave}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <UserMinus size={14} />
                        <span>채팅방 나가기</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="채팅창 닫기"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* 연결 상태 표시 */}
      {!isConnected && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
          <div className="flex items-center space-x-2">
            <WifiOff
              size={16}
              className="text-yellow-600 dark:text-yellow-400"
            />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              연결 중... 메시지 전송이 지연될 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* 연결됨 상태 (선택적 표시) */}
      {isConnected && showOnlineStatus && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-1">
          <div className="flex items-center space-x-2">
            <Wifi size={14} className="text-green-600 dark:text-green-400" />
            <p className="text-xs text-green-700 dark:text-green-300">연결됨</p>
          </div>
        </div>
      )}
    </>
  );
}
