import { io, Socket } from "socket.io-client";
import { getSession } from "next-auth/react";
import { authApi } from "./api/auth";

// Socket.io 클라이언트 인스턴스
let socket: Socket | null = null;

// 서버 URL 설정
const SERVER_URL =
  process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL || "http://localhost:4000";

/**
 * Socket.io 연결 초기화
 * NextAuth 세션이나 JWT 토큰을 사용하여 사용자 정보를 가져옵니다.
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

    // 연결 중이거나 연결 시도 중인 소켓이 있으면 기존 소켓 반환 (재연결 방지)
    if (socket && !socket.connected) {
      console.log("⏳ Socket 연결 대기 중 또는 연결 중...");
      // 기존 소켓이 연결 중이면 그대로 반환, 아니면 null 반환하여 재시도 방지
      return null;
    }

    // 사용자 정보 가져오기 (NextAuth 세션 또는 JWT 토큰)
    let userInfo: {
      userId: string;
      email?: string;
      username?: string;
      nickname?: string;
    } | null = null;

    // 1. NextAuth 세션 확인
    const session = await getSession();
    if (session?.user) {
      userInfo = {
        userId: (session.user as any).id,
        email: session.user.email || undefined,
        username: (session.user as any).username,
        nickname: (session.user as any).nickname || (session.user as any).name,
      };
    }

    // 2. NextAuth 세션이 없으면 JWT 토큰 확인 및 백엔드에서 사용자 정보 가져오기
    if (!userInfo) {
      const token = authApi.getToken();
      if (token) {
        try {
          console.log("🔵 JWT 토큰으로 사용자 정보 조회 중...");
          const response = await authApi.getCurrentUser();
          const user = (response as any)?.data?.user || (response as any)?.data;
          if (user?.id) {
            console.log("✅ 사용자 정보 조회 성공:", {
              id: user.id,
              username: user.username,
            });
            userInfo = {
              userId: user.id,
              email: user.email,
              username: user.username,
              nickname: user.nickname,
            };
          } else {
            console.warn("⚠️ 사용자 정보에 id가 없습니다:", user);
          }
        } catch (error: any) {
          console.error("🔴 백엔드 사용자 정보 조회 실패:", error);
          console.error("에러 상세:", {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
          });
          throw error; // 에러를 상위로 전파하여 연결 실패 처리
        }
      } else {
        console.warn("⚠️ JWT 토큰이 없습니다.");
      }
    }

    // 사용자 정보가 없으면 연결하지 않음
    if (!userInfo?.userId) {
      console.warn("⚠️ 인증 정보가 없어 Socket.io 연결을 생략합니다.");
      return null;
    }

    // 세션 데이터 준비
    const sessionData = {
      userId: userInfo.userId,
      email: userInfo.email,
      username: userInfo.username,
      nickname: userInfo.nickname,
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

    // 연결 상태를 Promise로 반환하여 연결 완료까지 대기
    return new Promise<Socket | null>((resolve) => {
      if (!socket) {
        resolve(null);
        return;
      }

      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.error("🔴 Socket.io 연결 타임아웃");
          resolve(null);
        }
      }, 10000); // 10초 타임아웃

      // 연결 성공
      socket.on("connect", () => {
        if (!resolved && socket) {
          resolved = true;
          clearTimeout(timeout);
          console.log("✅ Socket.io 연결 성공:", socket.id);
          resolve(socket);
        }
      });

      // 연결 오류
      socket.on("connect_error", (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.error("🔴 Socket.io 연결 오류:", error.message);
          resolve(null);
        }
      });

      // 이미 연결되어 있으면 즉시 resolve
      if (socket.connected) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log("✅ Socket.io 이미 연결됨:", socket.id);
          resolve(socket);
        }
      }
    }).then((connectedSocket) => {
      // 연결 해제 이벤트 리스너는 계속 유지
      if (connectedSocket) {
        connectedSocket.on("disconnect", (reason) => {
          console.log("❌ Socket.io 연결 해제:", reason);
        });
      }
      return connectedSocket;
    });
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
      console.error("❌ [Socket] 읽음 처리 실패: Socket 연결 없음");
      reject(new Error("Socket.io가 연결되지 않았습니다."));
      return;
    }

    console.log(
      `📖 [Socket] 읽음 처리 요청: messageId=${messageId}, roomId=${roomId}`
    );

    socket.emit(
      "mark_as_read",
      { message_id: messageId, room_id: roomId },
      (response: any) => {
        console.log(`📖 [Socket] 읽음 처리 응답:`, response);
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
 * 채팅방의 모든 메시지 읽음 처리
 */
export const markAllMessagesAsRead = (roomId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      console.error("❌ [Socket] 전체 읽음 처리 실패: Socket 연결 없음");
      reject(new Error("Socket.io가 연결되지 않았습니다."));
      return;
    }

    console.log(`📖 [Socket] 전체 읽음 처리 요청: roomId=${roomId}`);

    socket.emit("mark_all_as_read", { room_id: roomId }, (response: any) => {
      console.log(`📖 [Socket] 전체 읽음 처리 응답:`, response);
      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.error || "전체 읽음 처리에 실패했습니다."));
      }
    });
  });
};

/**
 * 메시지 삭제
 */
export const deleteMessage = (
  messageId: string,
  roomId: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error("Socket.io가 연결되지 않았습니다."));
      return;
    }

    socket.emit(
      "delete_message",
      { message_id: messageId, room_id: roomId },
      (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || "메시지 삭제에 실패했습니다."));
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
 * 메시지 삭제 수신 리스너 등록
 */
export const onMessageDeleted = (callback: (data: any) => void): void => {
  if (!socket) return;
  socket.on("message_deleted", callback);
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
  socket.off("message_deleted");
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
