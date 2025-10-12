/**
 * Socket.io 전역 이벤트 관리
 * 여러 컴포넌트에서 동일한 Socket 이벤트를 안전하게 구독할 수 있도록 함
 */

type EventCallback = (data: any) => void;

class SocketEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe(event: string, callback: EventCallback): () => void {
    // 1. 해당 이벤트의 리스너 목록이 없으면 생성
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    // 2. 콜백 함수 추가
    this.listeners.get(event)!.add(callback);

    // 3. 구독 취소 함수 반환 (cleanup용)
    // Unsubscribe 함수 반환
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SocketEventBus] Error in ${event} listener:`, error);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const socketEventBus = new SocketEventBus();
