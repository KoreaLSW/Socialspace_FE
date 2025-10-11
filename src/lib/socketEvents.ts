/**
 * Socket.io 전역 이벤트 관리
 * 여러 컴포넌트에서 동일한 Socket 이벤트를 안전하게 구독할 수 있도록 함
 */

type EventCallback = (data: any) => void;

class SocketEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

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


