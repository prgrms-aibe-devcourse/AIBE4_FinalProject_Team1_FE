import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getAccessToken } from '@/utils/auth.ts';
import type { NotificationResponse } from '@/types/notification.ts';

/**
 * SSE 연결 옵션
 */
interface SSEConnectionOptions {
  onConnect?: () => void;
  onNotification?: (notification: NotificationResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * SSE 연결 제어 객체
 */
interface SSEConnection {
  close: () => void;
}

/**
 * 알림 SSE 스트림 연결
 * GET /api/notifications/stream
 */
export function connectNotificationStream(
  options: SSEConnectionOptions
): SSEConnection {
  const { onConnect, onNotification, onError } = options;

  const controller = new AbortController();
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${baseURL}/api/notifications/stream`;

  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  fetchEventSource(url, {
    method: 'GET',
    headers,
    signal: controller.signal,

    onopen: async (response: Response) => {
      if (response.ok) {
        onConnect?.();
        return;
      }

      // 401은 토큰 갱신 중일 수 있으므로 조용히 종료
      if (response.status === 401) {
        controller.abort();
        return;
      }

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Client error: ${response.status}`);
      }
    },

    onmessage: (event: { event?: string; data: string }) => {
      try {
        const eventType = event.event || 'message';

        if (eventType === 'connect') {
          onConnect?.();
          return;
        }

        if (eventType === 'notification') {
          const notification = JSON.parse(event.data) as NotificationResponse;
          onNotification?.(notification);
        }
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
        onError?.(
          error instanceof Error ? error : new Error('Failed to parse SSE event')
        );
      }
    },

    onerror: (error: unknown) => {
      const errorObj =
        error instanceof Error ? error : new Error('SSE connection error');
      onError?.(errorObj);
      throw errorObj;
    },

    openWhenHidden: true,
  }).catch((error: unknown) => {
    // AbortError는 정상 종료이므로 무시
    if ((error as Error).name === 'AbortError') {
      return;
    }
    // 401 관련 에러는 토큰 갱신 후 재연결되므로 무시
    if ((error as Error).message?.includes('401')) {
      return;
    }
    console.error('SSE connection failed:', error);
  });

  return {
    close: () => {
      controller.abort();
    },
  };
}
