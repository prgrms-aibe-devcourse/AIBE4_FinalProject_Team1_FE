import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, MoreVertical } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatRelativeTime, formatAbsoluteDateTime } from '@/utils/notification';
import type { NotificationResponse } from '@/types/notification';

interface NotificationListProps {
  onClose?: () => void;
}

/**
 * 알림 목록 컴포넌트
 */
export default function NotificationList({ onClose }: NotificationListProps) {
  const navigate = useNavigate();
  const {
    notifications,
    isLoading,
    error,
    hasMore,
    currentPage,
    fetchNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
  } = useNotifications();

  useEffect(() => {
    void fetchNotifications(0);
  }, [fetchNotifications]);

  const handleLoadMore = (): void => {
    if (!isLoading && hasMore) {
      void fetchNotifications(currentPage + 1);
    }
  };

  const handleNotificationClick = (notification: NotificationResponse): void => {
    if (!notification.isRead) {
      void handleMarkAsRead(notification.notificationId);
    }

    if (notification.deepLink) {
      navigate(notification.deepLink);
      onClose?.();
    }
  };

  const handleMarkAllRead = (): void => {
    void handleMarkAllAsRead();
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    notificationId: number
  ): void => {
    e.stopPropagation();
    void handleDelete(notificationId);
  };

  return (
    <div className="flex max-h-[600px] flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-bold text-slate-900">알림</h3>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            모두 읽음
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-center text-sm font-medium text-red-600">{error}</div>
        )}

        {isLoading && notifications.length === 0 && (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="p-8 text-center text-sm font-medium text-slate-500">
            알림이 없습니다
          </div>
        )}

        {notifications.map((notification) => {
          return (
            <div
              key={notification.notificationId}
              className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                !notification.isRead ? 'bg-indigo-50/50' : ''
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* 알림 내용 */}
                <button
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className="flex-1 text-left cursor-pointer"
                >
                  {/* 첫 번째 줄: 안 읽음 점 + 타이틀 + 시간 */}
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                        !notification.isRead ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    />
                    <span className="text-sm font-bold text-slate-900 flex-1">
                      {notification.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>

                  {/* 두 번째 줄: 바디 */}
                  <p className="mb-1.5 text-sm text-slate-600 pl-4">
                    {notification.message}
                  </p>

                  {/* 세 번째 줄: 절대 시간 · 타입 (STORE_MEMBER_JOINED, STORE_MEMBER_REGISTERED 제외) */}
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-xs text-slate-500">
                      {formatAbsoluteDateTime(notification.createdAt)}
                    </span>
                    {notification.type !== 'STORE_MEMBER_JOINED' &&
                     notification.type !== 'STORE_MEMBER_REGISTERED' && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-medium text-slate-600">
                          {notification.type.replace(/_/g, ' ')}
                        </span>
                      </>
                    )}
                  </div>
                </button>

                {/* 우측 액션 버튼 */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, notification.notificationId)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
                  aria-label="더보기"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {hasMore && (
          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoading}
              className="w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '로딩 중...' : '더 보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
