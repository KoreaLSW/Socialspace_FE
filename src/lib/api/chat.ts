import { expressApi } from "./config";

// ========== 타입 정의 ==========

export interface ChatRoom {
  id: string;
  is_group: boolean;
  name?: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  members?: ChatRoomMember[];
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface ChatRoomMember {
  room_id: string;
  user_id: string;
  joined_at: string;
  role: "owner" | "admin" | "member";
  is_muted: boolean;
  last_read_at: string;
  user?: {
    id: string;
    username: string;
    nickname: string;
    profile_image?: string;
  };
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file" | "system";
  file_url?: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    nickname: string;
    profile_image?: string;
  };
  read_by?: MessageReadStatus[];
}

export interface MessageReadStatus {
  message_id: string;
  user_id: string;
  read_at: string;
  user?: {
    id: string;
    username: string;
    nickname: string;
    profile_image?: string;
  };
}

export interface UserChatSettings {
  user_id: string;
  allow_messages_from: "everyone" | "followers" | "none";
  show_online_status: boolean;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// API 응답 타입
export interface ChatRoomsResponse {
  success: boolean;
  data: ChatRoom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export interface ChatMessagesResponse {
  success: boolean;
  data: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export interface ChatRoomResponse {
  success: boolean;
  data: ChatRoom;
  message: string;
}

export interface ChatMessageResponse {
  success: boolean;
  data: ChatMessage;
  message: string;
}

export interface ChatMembersResponse {
  success: boolean;
  data: ChatRoomMember[];
  message: string;
}

export interface ChatSettingsResponse {
  success: boolean;
  data: UserChatSettings;
  message: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
  message: string;
}

// ========== API 함수들 ==========

/**
 * 채팅방 생성 또는 기존 1:1 채팅방 반환
 */
export const createOrGetRoom = async (
  targetUserId: string,
  isGroup: boolean = false,
  name?: string
): Promise<ChatRoom> => {
  const response = await expressApi.post<ChatRoomResponse>("/chat/rooms", {
    target_user_id: targetUserId,
    is_group: isGroup,
    name,
  });
  return response.data.data;
};

/**
 * 그룹 채팅방 생성
 */
export const createGroupRoom = async (
  memberUserIds: string[],
  name: string
): Promise<ChatRoom> => {
  const response = await expressApi.post<ChatRoomResponse>("/chat/rooms", {
    target_user_id: memberUserIds,
    is_group: true,
    name,
  });
  return response.data.data;
};

/**
 * 사용자의 채팅방 목록 조회
 */
export const getUserRooms = async (
  page: number = 1,
  limit: number = 20,
  search: string = ""
): Promise<ChatRoomsResponse> => {
  const params: any = { page, limit };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  const response = await expressApi.get<ChatRoomsResponse>("/chat/rooms", {
    params,
  });
  return response.data;
};

/**
 * 채팅방 멤버 조회
 */
export const getRoomMembers = async (
  roomId: string
): Promise<ChatRoomMember[]> => {
  const response = await expressApi.get<ChatMembersResponse>(
    `/chat/rooms/${roomId}/members`
  );
  return response.data.data;
};

/**
 * 채팅방 안읽은 메시지 수 조회
 */
export const getUnreadCount = async (roomId: string): Promise<number> => {
  const response = await expressApi.get<UnreadCountResponse>(
    `/chat/rooms/${roomId}/unread-count`
  );
  return response.data.data.count;
};

/**
 * 채팅방에 멤버 추가 (그룹 채팅 초대)
 */
export const addMembersToRoom = async (
  roomId: string,
  userIds: string[]
): Promise<void> => {
  await expressApi.post(`/chat/rooms/${roomId}/members`, {
    user_ids: userIds,
  });
};

/**
 * 메시지 전송 (HTTP API - 백업용)
 */
export const sendMessage = async (
  roomId: string,
  content: string,
  messageType: "text" | "image" | "file" = "text",
  fileData?: {
    file_url?: string;
    file_name?: string;
    file_size?: number;
  }
): Promise<ChatMessage> => {
  const response = await expressApi.post<ChatMessageResponse>(
    "/chat/messages",
    {
      room_id: roomId,
      content,
      message_type: messageType,
      ...fileData,
    }
  );
  return response.data.data;
};

/**
 * 채팅방 메시지 목록 조회
 */
export const getRoomMessages = async (
  roomId: string,
  page: number = 1,
  limit: number = 50
): Promise<ChatMessagesResponse> => {
  const response = await expressApi.get<ChatMessagesResponse>(
    `/chat/rooms/${roomId}/messages`,
    {
      params: { page, limit },
    }
  );
  return response.data;
};

/**
 * 메시지 읽음 처리 (HTTP API - 백업용)
 */
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  await expressApi.post(`/chat/messages/${messageId}/read`);
};

/**
 * 사용자 채팅 설정 조회
 */
export const getChatSettings = async (): Promise<UserChatSettings> => {
  const response = await expressApi.get<ChatSettingsResponse>("/chat/settings");
  return response.data.data;
};

/**
 * 사용자 채팅 설정 업데이트
 */
export const updateChatSettings = async (
  settings: Partial<
    Pick<
      UserChatSettings,
      "allow_messages_from" | "show_online_status" | "notification_enabled"
    >
  >
): Promise<UserChatSettings> => {
  const response = await expressApi.put<ChatSettingsResponse>(
    "/chat/settings",
    settings
  );
  return response.data.data;
};

/**
 * 채팅 파일 업로드
 */
export const uploadChatFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{
  fileUrl: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileType: "image" | "file";
  mimeType: string;
}> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await expressApi.post("/chat/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 60000, // 60초로 타임아웃 연장 (파일 업로드용)
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    },
  });

  return response.data.data;
};

/**
 * 모든 채팅방에서 검색
 */
export const searchAllChatRooms = async (
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  rooms: Array<ChatRoom & { message_count: number }>;
  total: number;
}> => {
  const response = await expressApi.get("/chat/search/rooms", {
    params: { q: query, page, limit },
  });
  return response.data.data;
};

/**
 * 특정 채팅방에서 메시지 검색
 */
export const searchMessagesInRoom = async (
  roomId: string,
  query: string,
  page: number = 1,
  limit: number = 50
): Promise<{
  messages: ChatMessage[];
  total: number;
}> => {
  const response = await expressApi.get(`/chat/search/messages/${roomId}`, {
    params: { q: query, page, limit },
  });
  return response.data.data;
};

// ========== SWR용 키 생성 함수들 ==========

export const chatKeys = {
  rooms: (page: number, limit: number, search: string = "") => [
    "chat",
    "rooms",
    page,
    limit,
    search,
  ],
  roomMessages: (roomId: string, page: number, limit: number) => [
    "chat",
    "messages",
    roomId,
    page,
    limit,
  ],
  roomMembers: (roomId: string) => ["chat", "members", roomId],
  searchRooms: (query: string, page: number, limit: number) => [
    "chat",
    "search",
    "rooms",
    query,
    page,
    limit,
  ],
  searchMessages: (
    roomId: string,
    query: string,
    page: number,
    limit: number
  ) => ["chat", "search", "messages", roomId, query, page, limit],
  unreadCount: (roomId: string) => ["chat", "unread", roomId],
  settings: () => ["chat", "settings"],
} as const;
