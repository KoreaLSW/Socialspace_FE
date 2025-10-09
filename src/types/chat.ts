// 채팅 관련 공통 타입 정의
import { ChatRoom, ChatMessage, ChatRoomMember } from "@/lib/api/chat";

// 확장된 채팅방 인터페이스 (UI용)
export interface UiChatRoom extends ChatRoom {
  members?: ChatRoomMember[];
  last_message?: ChatMessage;
  unread_count?: number;
  other_member?: ChatRoomMember; // 1:1 채팅용 상대방 정보
}

// 채팅방 목록 아이템 Props
export interface ChatRoomItemProps {
  room: UiChatRoom;
  currentUserId: string;
  onClick: (room: UiChatRoom) => void;
  onLeave?: (roomId: string) => Promise<void>;
  showUnreadCount?: boolean;
  showLastMessage?: boolean;
  showAvatar?: boolean;
}

// 채팅 메시지 아이템 Props
export interface ChatMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender?: boolean;
  showTime?: boolean;
  onImageClick?: (imageUrl: string) => void;
  onFileDownload?: (fileUrl: string, fileName: string) => void;
  onDelete?: (messageId: string) => void;
  totalMemberCount?: number; // 채팅방 전체 멤버 수 (읽음 표시 계산용)
}

// 채팅 입력 컴포넌트 Props
export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  showFileUpload?: boolean;
  onFileSelect?: (file: File) => void;
}

// 채팅방 헤더 Props
export interface ChatRoomHeaderProps {
  room: UiChatRoom;
  currentUserId: string;
  onClose: () => void;
  onSettings?: () => void;
  onSearch?: () => void;
  onLeave?: (roomId: string) => Promise<void>;
  showOnlineStatus?: boolean;
  isConnected?: boolean;
}

// 사용자 검색 결과 타입
export interface UserSearchResult {
  id: string;
  username: string;
  nickname: string;
  profileImage?: string;
  isFollowing?: boolean;
  mutualFollowCount?: number;
}

// 사용자 검색 컴포넌트 Props
export interface UserSearchProps {
  onUserSelect: (user: UserSearchResult) => void;
  placeholder?: string;
  showMutualFollows?: boolean;
  excludeUserIds?: string[];
}

// 채팅방 설정 타입
export interface ChatRoomSettings {
  notifications: boolean;
  sounds: boolean;
  showOnlineStatus: boolean;
}

// 타이핑 상태 표시 Props
export interface TypingIndicatorProps {
  typingUsers: string[];
  currentUserId: string;
  maxDisplay?: number;
}

// 안읽은 메시지 배지 Props
export interface UnreadBadgeProps {
  count: number;
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
}
