import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ensureAccessToken, reissueAccessToken } from '@/api/user/client.ts';
import type { NotificationResponse } from '@/types/notification.ts';

interface SSEConnectionOptions {
    onConnect?: () => void;
    onNotification?: (notification: NotificationResponse) => void;
    onError?: (error: Error) => void;
}

interface SSEConnection {
    close: () => void;
}

const resolveApiBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        return import.meta.env.VITE_API_BASE_URL || '';
    }

    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocal) {
        return '';
    }

    return import.meta.env.VITE_API_BASE_URL || '';
};

export function connectNotificationStream(
    options: SSEConnectionOptions,
): SSEConnection {
    const { onConnect, onNotification, onError } = options;

    const baseURL = resolveApiBaseUrl();
    const url = `${baseURL}/api/notifications/stream`;

    let closed = false;
    let controller: AbortController | null = null;
    let reconnectTimer: number | null = null;

    const clearReconnectTimer = () => {
        if (reconnectTimer !== null) {
            window.clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    };

    const scheduleReconnect = (delay = 1500) => {
        if (closed) return;
        clearReconnectTimer();
        reconnectTimer = window.setTimeout(() => {
            void start();
        }, delay);
    };

    const start = async () => {
        if (closed) return;

        const token = await ensureAccessToken();
        if (!token) {
            onError?.(new Error('SSE 인증 토큰이 없습니다.'));
            return;
        }

        controller = new AbortController();

        try {
            await fetchEventSource(url, {
                method: 'GET',
                headers: {
                    Accept: 'text/event-stream',
                    Authorization: `Bearer ${token}`,
                },
                signal: controller.signal,
                openWhenHidden: true,

                onopen: async (response: Response) => {
                    if (response.ok) {
                        onConnect?.();
                        return;
                    }

                    if (response.status === 401) {
                        throw new Error('SSE_UNAUTHORIZED');
                    }

                    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        throw new Error(`SSE_CLIENT_ERROR_${response.status}`);
                    }

                    if (response.status >= 500) {
                        throw new Error(`SSE_SERVER_ERROR_${response.status}`);
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
                        const parsedError =
                            error instanceof Error
                                ? error
                                : new Error('Failed to parse SSE event');
                        console.error('Failed to parse SSE event:', parsedError);
                        onError?.(parsedError);
                    }
                },

                onerror: (error: unknown) => {
                    const errorObj =
                        error instanceof Error ? error : new Error('SSE connection error');
                    throw errorObj;
                },
            });
        } catch (error) {
            if (closed) return;

            const errorObj =
                error instanceof Error ? error : new Error('SSE connection failed');

            if (errorObj.name === 'AbortError') {
                return;
            }

            if (errorObj.message === 'SSE_UNAUTHORIZED') {
                const newToken = await reissueAccessToken();

                if (!newToken) {
                    onError?.(new Error('SSE 재인증 실패'));
                    return;
                }

                scheduleReconnect(300);
                return;
            }

            onError?.(errorObj);
            scheduleReconnect();
        }
    };

    void start();

    return {
        close: () => {
            closed = true;
            clearReconnectTimer();
            controller?.abort();
        },
    };
}