import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { connectNotificationStream } from '@/api/notificationSse';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/api/notification';
import { getAccessToken } from '@/utils/auth';
import type { NotificationResponse } from '@/types/notification';
import type { PageResponse } from '@/types/common/common';

interface NotificationContextValue {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  fetchNotifications: (page?: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  handleMarkAsRead: (notificationId: number) => Promise<void>;
  handleMarkAllAsRead: () => Promise<void>;
  handleDelete: (notificationId: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<{
    currentPage: number;
    hasMore: boolean;
  }>({
    currentPage: 0,
    hasMore: false,
  });

  const [authToken, setAuthToken] = useState<string | null>(getAccessToken());
  const sseConnectionRef = useRef<{ close: () => void } | null>(null);
  const isConnectedRef = useRef<boolean>(false);

  /**
   * 안 읽은 개수 갱신
   */
  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  /**
   * 알림 목록 조회
   */
  const fetchNotifications = useCallback(
    async (page = 0): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response: PageResponse<NotificationResponse> = await getNotifications({
          page,
          size: 20,
        });

        if (page === 0) {
          setNotifications(response.content);
        } else {
          setNotifications((prev) => [...prev, ...response.content]);
        }

        setPageInfo({
          currentPage: response.page,
          hasMore: response.hasNext,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch notifications';
        setError(errorMessage);
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 개별 읽음 처리
   */
  const handleMarkAsRead = useCallback(
    async (notificationId: number): Promise<void> => {
      try {
        await markAsRead(notificationId);

        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notificationId ? { ...n, isRead: true } : n
          )
        );

        await refreshUnreadCount();
      } catch (err) {
        console.error('Failed to mark as read:', err);
        throw err;
      }
    },
    [refreshUnreadCount]
  );

  /**
   * 전체 읽음 처리
   */
  const handleMarkAllAsRead = useCallback(async (): Promise<void> => {
    try {
      await markAllAsRead();

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      throw err;
    }
  }, []);

  /**
   * 알림 삭제
   */
  const handleDelete = useCallback(
    async (notificationId: number): Promise<void> => {
      try {
        await deleteNotification(notificationId);

        setNotifications((prev) =>
          prev.filter((n) => n.notificationId !== notificationId)
        );

        await refreshUnreadCount();
      } catch (err) {
        console.error('Failed to delete notification:', err);
        throw err;
      }
    },
    [refreshUnreadCount]
  );

  /**
   * 새 알림 추가 (중복 방지)
   */
  const addNewNotification = useCallback(
    (notification: NotificationResponse): void => {
      setNotifications((prev) => {
        const exists = prev.some(
          (n) => n.notificationId === notification.notificationId
        );

        if (exists) {
          return prev;
        }

        return [notification, ...prev];
      });
    },
    []
  );

  /**
   * 인증 상태 변경 감지
   */
  useEffect(() => {
    const handleAuthChange = (): void => {
      const currentToken = getAccessToken();
      setAuthToken(currentToken);
    };

    window.addEventListener('auth:change', handleAuthChange);
    return () => {
      window.removeEventListener('auth:change', handleAuthChange);
    };
  }, []);

  /**
   * 로그인 상태에서 unreadCount 로드
   */
  useEffect(() => {
    if (authToken) {
      void refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [authToken, refreshUnreadCount]);

  /**
   * SSE 연결 설정
   */
  useEffect(() => {
    // 로그인되지 않은 경우 연결 해제 및 상태 초기화
    if (!authToken) {
      if (sseConnectionRef.current) {
        console.log('SSE disconnecting due to logout');
        sseConnectionRef.current.close();
        sseConnectionRef.current = null;
      }
      isConnectedRef.current = false;
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // 이미 연결된 경우 중복 연결 방지
    if (isConnectedRef.current) {
      return;
    }

    // SSE 연결
    isConnectedRef.current = true;
    console.log('[NotificationContext] SSE connecting...');

    const connection = connectNotificationStream({
      onConnect: () => {
        console.log('[NotificationContext] SSE connected successfully');
        void refreshUnreadCount();
      },
      onNotification: (notification: NotificationResponse) => {
        console.log('[NotificationContext] New notification received:', {
          type: notification.type,
          title: notification.title,
          notificationId: notification.notificationId,
          isRead: notification.isRead,
        });
        addNewNotification(notification);
        void refreshUnreadCount();
      },
      onError: (err: Error) => {
        console.error('[NotificationContext] SSE error:', err);
      },
    });

    sseConnectionRef.current = connection;

    return () => {
      if (sseConnectionRef.current) {
        console.log('SSE cleanup');
        sseConnectionRef.current.close();
        sseConnectionRef.current = null;
      }
      isConnectedRef.current = false;
    };
  }, [authToken, refreshUnreadCount, addNewNotification]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore: pageInfo.hasMore,
    currentPage: pageInfo.currentPage,
    fetchNotifications,
    refreshUnreadCount,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
