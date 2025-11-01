import { useEffect, useState, useCallback, useRef } from "react";
import { useCurrentUser } from "@/hooks/useAuth";
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
  const { user, isAuthenticated, isLoading: isAuthLoading } = useCurrentUser();
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
    // 이미 연결되어 있으면 재연결 시도하지 않음
    if (socket?.connected) {
      return;
    }

    // 연결 시도 중이면 대기
    if (isConnectingRef.current) {
      return;
    }

    // 재시도 횟수가 최대값을 초과하면 더 이상 시도하지 않음
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn(
        `⚠️ Socket 재연결 시도 횟수 초과 (${maxReconnectAttempts}회)`
      );
      return;
    }

    if (isAuthLoading) return; // 인증 로딩 중이면 대기
    if (!isAuthenticated || !user?.id) {
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
        setStatus("disconnected"); // error 대신 disconnected로 설정하여 재시도 방지
        reconnectAttemptsRef.current += 1;
        console.error(
          `❌ Socket 연결 실패 (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
        );
        // 연결 실패 이유를 더 자세히 로깅
        console.error("연결 실패 원인: initializeSocket이 null 반환");
      }
    } catch (error) {
      console.error("🔴 Socket 연결 중 오류:", error);
      setStatus("disconnected"); // error 대신 disconnected로 설정
      reconnectAttemptsRef.current += 1;
    } finally {
      isConnectingRef.current = false;
    }
  }, [user, isAuthenticated, isAuthLoading, socket]);

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
    if (isAuthLoading) return; // 로딩 중이면 대기

    // 인증되지 않았거나 사용자 정보가 없으면 연결 해제
    if (!isAuthenticated || !user?.id) {
      if (status !== "disconnected") {
        console.log("🔌 세션 종료로 Socket 연결 해제");
        disconnect();
      }
      return;
    }

    // 인증되었고 연결되지 않은 상태일 때만 연결 시도
    if (status === "disconnected" && !isConnectingRef.current) {
      console.log("🔌 자동 Socket 연결 시도");
      connect();
    }

    // cleanup 함수에서는 연결 해제하지 않음 (인증 상태가 변경될 때만 해제)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, isAuthLoading]); // status 제거하여 무한 루프 방지

  // Socket 이벤트 리스너 설정 (전역 이벤트 버스로 브로드캐스트)
  useEffect(() => {
    const currentSocket = getSocket();
    if (!currentSocket) {
      // 전역 소켓이 없으면 로컬 상태도 disconnected로 설정
      if (status !== "disconnected") {
        setStatus("disconnected");
      }
      return;
    }

    // 전역 소켓이 이미 연결되어 있으면 상태 업데이트
    if (currentSocket.connected && status !== "connected") {
      setStatus("connected");
      setSocket(currentSocket);
      console.log("✅ 전역 Socket 이미 연결됨 - 상태 동기화");
    }

    const handleConnect = () => {
      setStatus("connected");
      setSocket(currentSocket);
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
        if (isAuthenticated && user?.id) {
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

    const handleAllMessagesRead = (data: any) => {
      console.log(
        "🔔 [useSocket] all_messages_read 수신 -> EventBus 전파:",
        data
      );
      socketEventBus.emit("all_messages_read", data);
    };

    // Socket 이벤트 수신 여부 확인용 (서버 환경 디버깅)
    const handleAnyEvent = (eventName: string) => {
      return (data: any) => {
        console.log(`🔍 [useSocket] 이벤트 수신됨: ${eventName}`, data);
      };
    };

    currentSocket.on("connect", handleConnect);
    currentSocket.on("disconnect", handleDisconnect);
    currentSocket.on("connect_error", handleConnectError);

    // Socket 이벤트 리스너 등록 (한 번만!)
    currentSocket.on("new_message", handleNewMessage);
    currentSocket.on("message_read", handleMessageRead);
    currentSocket.on("message_deleted", handleMessageDeleted);
    currentSocket.on("user_typing", handleUserTyping);
    currentSocket.on("all_messages_read", handleAllMessagesRead);

    // 디버깅용: 모든 이벤트 수신 확인
    currentSocket.onAny((eventName, ...args) => {
      console.log(`🔍 [useSocket] 모든 이벤트 수신: ${eventName}`, args);
    });

    console.log("✅ [useSocket] 전역 Socket 이벤트 리스너 등록 완료");

    return () => {
      currentSocket.off("connect", handleConnect);
      currentSocket.off("disconnect", handleDisconnect);
      currentSocket.off("connect_error", handleConnectError);
      currentSocket.off("new_message", handleNewMessage);
      currentSocket.off("message_read", handleMessageRead);
      currentSocket.off("message_deleted", handleMessageDeleted);
      currentSocket.off("user_typing", handleUserTyping);
      currentSocket.off("all_messages_read", handleAllMessagesRead);
      currentSocket.offAny();

      console.log("🔌 [useSocket] 전역 Socket 이벤트 리스너 제거");
    };
  }, [socket, status, isAuthenticated, reconnect]);

  // 전역 소켓 상태를 주기적으로 확인하여 동기화
  useEffect(() => {
    const checkSocketStatus = () => {
      const currentSocket = getSocket();
      if (currentSocket?.connected && status !== "connected") {
        setStatus("connected");
        setSocket(currentSocket);
        console.log("✅ 전역 Socket 연결 상태 확인 - 상태 동기화");
      } else if (!currentSocket?.connected && status === "connected") {
        setStatus("disconnected");
        console.log("⚠️ 전역 Socket 연결 끊김 확인 - 상태 동기화");
      }
    };

    // 즉시 확인
    checkSocketStatus();

    // 주기적으로 확인 (5초마다)
    const interval = setInterval(checkSocketStatus, 5000);

    return () => clearInterval(interval);
  }, [status]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  // 연결 상태 계산: 로컬 소켓 또는 전역 소켓 중 하나라도 연결되어 있으면 연결된 것으로 간주
  const isConnected =
    (status === "connected" && (socket?.connected || isSocketConnected())) ||
    isSocketConnected(); // 전역 소켓이 연결되어 있으면 연결된 것으로 간주

  return {
    socket,
    status,
    isConnected,
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
    console.log("🎧 [useSocket] onRead 구독 시작");
    return socketEventBus.subscribe("message_read", (data: any) => {
      console.log(
        "📣 [useSocket] onRead 콜백 실행 - EventBus에서 전파받음:",
        data
      );
      callback(data);
    });
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

  /**
   * 모든 메시지 읽음 상태 수신 리스너
   */
  const onAllRead = useCallback((callback: (data: any) => void) => {
    return socketEventBus.subscribe("all_messages_read", callback);
  }, []);

  return {
    onMessage,
    onRead,
    onDeleted,
    onTyping,
    onAllRead,
    isConnected,
  };
};
