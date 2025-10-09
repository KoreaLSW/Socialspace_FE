import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Socket } from "socket.io-client";
import {
  initializeSocket,
  getSocket,
  disconnectSocket,
  isSocketConnected,
  removeAllChatListeners,
} from "@/lib/socket";
import { socketEventBus } from "@/lib/socketEvents";

// Socket 연결 상태 타입
export type SocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

// Socket 훅 반환 타입
export interface UseSocketReturn {
  socket: Socket | null;
  status: SocketStatus;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

/**
 * Socket.io 연결 관리 훅
 */
export const useSocket = (): UseSocketReturn => {
  const { data: session, status: sessionStatus } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  /**
   * Socket 연결
   */
  const connect = useCallback(async () => {
    if (isConnectingRef.current) return;
    if (sessionStatus !== "authenticated" || !session?.user) {
      console.warn("⚠️ 세션이 없어 Socket 연결을 건너뜁니다.");
      return;
    }

    try {
      isConnectingRef.current = true;
      setStatus("connecting");

      const socketInstance = await initializeSocket();
      if (socketInstance) {
        setSocket(socketInstance);
        setStatus("connected");
        reconnectAttemptsRef.current = 0; // 연결 성공 시 재시도 횟수 초기화
        console.log("✅ Socket 연결 성공");
      } else {
        setStatus("error");
        console.error("❌ Socket 연결 실패");
      }
    } catch (error) {
      console.error("🔴 Socket 연결 중 오류:", error);
      setStatus("error");
    } finally {
      isConnectingRef.current = false;
    }
  }, [session, sessionStatus]);

  /**
   * Socket 연결 해제
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    removeAllChatListeners();
    disconnectSocket();
    setSocket(null);
    setStatus("disconnected");
    console.log("🔌 Socket 연결 해제");
  }, []);

  /**
   * Socket 재연결
   */
  const reconnect = useCallback(async () => {
    disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
    await connect();
  }, [connect, disconnect]);

  // 세션 상태가 변경될 때 자동 연결/해제
  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      session?.user &&
      status === "disconnected"
    ) {
      console.log("🔌 자동 Socket 연결 시도");
      connect();
    } else if (sessionStatus === "unauthenticated") {
      console.log("🔌 세션 종료로 Socket 연결 해제");
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [sessionStatus, session?.user?.id]); // connect, disconnect 의존성 제거로 무한 루프 방지

  // Socket 이벤트 리스너 설정 (전역 이벤트 버스로 브로드캐스트)
  useEffect(() => {
    const currentSocket = getSocket();
    if (!currentSocket) return;

    const handleConnect = () => {
      setStatus("connected");
      console.log("✅ Socket 재연결 성공");
    };

    const handleDisconnect = (reason: string) => {
      setStatus("disconnected");
      console.log("❌ Socket 연결 끊김:", reason);

      // 자동 재연결 시도 (네트워크 오류인 경우)
      if (reason === "io server disconnect") {
        // 서버에서 연결을 끊은 경우 재연결하지 않음
        return;
      }

      // 최대 재연결 시도 횟수 확인
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error(
          `❌ 최대 재연결 시도 횟수(${maxReconnectAttempts})에 도달했습니다.`
        );
        setStatus("error");
        return;
      }

      // 지수 백오프 방식으로 재연결 시도
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttemptsRef.current),
        30000
      );
      reconnectAttemptsRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(() => {
        if (sessionStatus === "authenticated") {
          console.log(
            `🔄 Socket 자동 재연결 시도... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
          reconnect();
        }
      }, delay);
    };

    const handleConnectError = (error: any) => {
      setStatus("error");
      console.error("🔴 Socket 연결 오류:", error.message);
    };

    // Socket 이벤트를 전역 이벤트 버스로 전파
    const handleNewMessage = (data: any) => {
      console.log("🔔 [useSocket] new_message 수신 -> EventBus 전파:", data);
      socketEventBus.emit("new_message", data);
    };

    const handleMessageRead = (data: any) => {
      console.log("🔔 [useSocket] message_read 수신 -> EventBus 전파:", data);
      socketEventBus.emit("message_read", data);
    };

    const handleMessageDeleted = (data: any) => {
      console.log(
        "🔔 [useSocket] message_deleted 수신 -> EventBus 전파:",
        data
      );
      socketEventBus.emit("message_deleted", data);
    };

    const handleUserTyping = (data: any) => {
      socketEventBus.emit("user_typing", data);
    };

    currentSocket.on("connect", handleConnect);
    currentSocket.on("disconnect", handleDisconnect);
    currentSocket.on("connect_error", handleConnectError);

    // Socket 이벤트 리스너 등록 (한 번만!)
    currentSocket.on("new_message", handleNewMessage);
    currentSocket.on("message_read", handleMessageRead);
    currentSocket.on("message_deleted", handleMessageDeleted);
    currentSocket.on("user_typing", handleUserTyping);

    console.log("✅ [useSocket] 전역 Socket 이벤트 리스너 등록 완료");

    return () => {
      currentSocket.off("connect", handleConnect);
      currentSocket.off("disconnect", handleDisconnect);
      currentSocket.off("connect_error", handleConnectError);
      currentSocket.off("new_message", handleNewMessage);
      currentSocket.off("message_read", handleMessageRead);
      currentSocket.off("message_deleted", handleMessageDeleted);
      currentSocket.off("user_typing", handleUserTyping);

      console.log("🔌 [useSocket] 전역 Socket 이벤트 리스너 제거");
    };
  }, [socket, sessionStatus, reconnect]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    status,
    isConnected: status === "connected" && isSocketConnected(),
    connect,
    disconnect,
    reconnect,
  };
};

/**
 * Socket 이벤트 리스너 훅 (전역 이벤트 버스 사용)
 */
export const useSocketEvents = () => {
  const { isConnected } = useSocket();

  /**
   * 새 메시지 수신 리스너
   */
  const onMessage = useCallback((callback: (data: any) => void) => {
    return socketEventBus.subscribe("new_message", callback);
  }, []);

  /**
   * 메시지 읽음 상태 수신 리스너
   */
  const onRead = useCallback((callback: (data: any) => void) => {
    return socketEventBus.subscribe("message_read", callback);
  }, []);

  /**
   * 메시지 삭제 수신 리스너
   */
  const onDeleted = useCallback((callback: (data: any) => void) => {
    return socketEventBus.subscribe("message_deleted", callback);
  }, []);

  /**
   * 타이핑 상태 수신 리스너
   */
  const onTyping = useCallback((callback: (data: any) => void) => {
    return socketEventBus.subscribe("user_typing", callback);
  }, []);

  return {
    onMessage,
    onRead,
    onDeleted,
    onTyping,
    isConnected,
  };
};
