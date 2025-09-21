import { io, Socket } from "socket.io-client";
import { getSession } from "next-auth/react";

// Socket.io 클라이언트 인스턴스
let socket: Socket | null = null;

// 서버 URL 설정
const SERVER_URL =
  process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL || "http://localhost:4000";

/**
 * Socket.io 연결 초기화
 */
export const initializeSocket = async (): Promise<Socket | null> => {
  if (typeof window === "undefined") {
    return null; // 서버 사이드에서는 소켓 연결하지 않음
  }

  try {
    // 이미 연결된 소켓이 있으면 재사용
    if (socket?.connected) {
      console.log("🔄 기존 Socket 연결 재사용");
      return socket;
    }

    // 연결 중이거나 연결 시도 중인 소켓이 있으면 대기
    if (socket && !socket.connected) {
      console.log("⏳ Socket 연결 대기 중...");
      return socket;
    }

    // NextAuth 세션 정보 가져오기
    const session = await getSession();
    if (!session?.user) {
      console.warn("⚠️ NextAuth 세션이 없어 Socket.io 연결을 생략합니다.");
      return null;
    }

    // 세션 데이터 준비
    const sessionData = {
      userId: (session.user as any).id,
      email: session.user.email,
      username: (session.user as any).username,
      nickname: (session.user as any).nickname,
    };

    // Base64 인코딩
    const encodedSessionData = btoa(
      encodeURIComponent(JSON.stringify(sessionData))
    );

    // Socket.io 클라이언트 생성
    socket = io(SERVER_URL, {
      auth: {
        sessionData: encodedSessionData,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    // 연결 이벤트 리스너
    socket.on("connect", () => {
      console.log("✅ Socket.io 연결 성공:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket.io 연결 해제:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 Socket.io 연결 오류:", error.message);
    });

    return socket;
  } catch (error) {
    console.error("🔴 Socket.io 초기화 실패:", error);
    return null;
  }
};

/**
 * 현재 Socket.io 인스턴스 반환
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Socket.io 연결 해제
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket.io 연결을 해제했습니다.");
  }
};

/**
 * Socket.io 연결 상태 확인
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

// ========== 채팅 관련 Socket 이벤트 헬퍼 함수들 ==========

/**
 * 메시지 전송
 */
export const sendMessage = (
  roomId: string,
  content: string,
  messageType: "text" | "image" | "file" = "text",
  fileData?: {
    file_url?: string;
    file_name?: string;
    file_size?: number;
  }
): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error("Socket.io가 연결되지 않았습니다."));
      return;
    }

    const messageData = {
      room_id: roomId,
      content,
      message_type: messageType,
      ...fileData,
    };

    socket.emit("send_message", messageData, (response: any) => {
      if (response.success) {
        resolve(response.message);
      } else {
        reject(new Error(response.error || "메시지 전송에 실패했습니다."));
      }
    });
  });
};

/**
 * 채팅방 참여
 */
export const joinRoom = (roomId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error("Socket.io가 연결되지 않았습니다."));
      return;
    }

    socket.emit("join_room", { room_id: roomId }, (response: any) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.error || "채팅방 참여에 실패했습니다."));
      }
    });
  });
};

/**
 * 메시지 읽음 처리
 */
export const markMessageAsRead = (
  messageId: string,
  roomId?: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error("Socket.io가 연결되지 않았습니다."));
      return;
    }

    socket.emit(
      "mark_as_read",
      { message_id: messageId, room_id: roomId },
      (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || "읽음 처리에 실패했습니다."));
        }
      }
    );
  });
};

/**
 * 타이핑 상태 전송
 */
export const sendTypingStatus = (roomId: string, isTyping: boolean): void => {
  if (!socket?.connected) return;

  const event = isTyping ? "typing" : "stop_typing";
  socket.emit(event, { room_id: roomId });
};

// ========== Socket 이벤트 리스너 등록/해제 헬퍼들 ==========

/**
 * 새 메시지 수신 리스너 등록
 */
export const onNewMessage = (callback: (data: any) => void): void => {
  if (!socket) return;
  socket.on("new_message", callback);
};

/**
 * 메시지 읽음 상태 수신 리스너 등록
 */
export const onMessageRead = (callback: (data: any) => void): void => {
  if (!socket) return;
  socket.on("message_read", callback);
};

/**
 * 타이핑 상태 수신 리스너 등록
 */
export const onUserTyping = (callback: (data: any) => void): void => {
  if (!socket) return;
  socket.on("user_typing", callback);
};

/**
 * 모든 채팅 관련 리스너 제거
 */
export const removeAllChatListeners = (): void => {
  if (!socket) return;

  socket.off("new_message");
  socket.off("message_read");
  socket.off("user_typing");
};

/**
 * 특정 이벤트 리스너 제거
 */
export const removeListener = (
  event: string,
  callback?: (...args: any[]) => void
): void => {
  if (!socket) return;
  socket.off(event, callback);
};
