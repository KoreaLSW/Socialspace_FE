import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Socket } from "socket.io-client";
import {
  initializeSocket,
  getSocket,
  disconnectSocket,
  isSocketConnected,
  onNewMessage,
  onMessageRead,
  onUserTyping,
  removeAllChatListeners,
} from "@/lib/socket";

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

  // Socket 이벤트 리스너 설정
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

      // 3초 후 재연결 시도
      reconnectTimeoutRef.current = setTimeout(() => {
        if (sessionStatus === "authenticated") {
          console.log("🔄 Socket 자동 재연결 시도...");
          reconnect();
        }
      }, 3000);
    };

    const handleConnectError = (error: any) => {
      setStatus("error");
      console.error("🔴 Socket 연결 오류:", error.message);
    };

    currentSocket.on("connect", handleConnect);
    currentSocket.on("disconnect", handleDisconnect);
    currentSocket.on("connect_error", handleConnectError);

    return () => {
      currentSocket.off("connect", handleConnect);
      currentSocket.off("disconnect", handleDisconnect);
      currentSocket.off("connect_error", handleConnectError);
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
 * Socket 이벤트 리스너 훅
 */
export const useSocketEvents = () => {
  const { socket, isConnected } = useSocket();

  /**
   * 새 메시지 수신 리스너
   */
  const onMessage = useCallback(
    (callback: (data: any) => void) => {
      if (!isConnected) return () => {};

      onNewMessage(callback);
      return () => {
        socket?.off("new_message", callback);
      };
    },
    [socket, isConnected]
  );

  /**
   * 메시지 읽음 상태 수신 리스너
   */
  const onRead = useCallback(
    (callback: (data: any) => void) => {
      if (!isConnected) return () => {};

      onMessageRead(callback);
      return () => {
        socket?.off("message_read", callback);
      };
    },
    [socket, isConnected]
  );

  /**
   * 타이핑 상태 수신 리스너
   */
  const onTyping = useCallback(
    (callback: (data: any) => void) => {
      if (!isConnected) return () => {};

      onUserTyping(callback);
      return () => {
        socket?.off("user_typing", callback);
      };
    },
    [socket, isConnected]
  );

  return {
    onMessage,
    onRead,
    onTyping,
    isConnected,
  };
};
