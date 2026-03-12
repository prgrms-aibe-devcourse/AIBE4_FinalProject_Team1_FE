import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Trash2, MoreVertical } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatRelativeTime, formatAbsoluteDateTime } from '@/utils/notification';
import type { NotificationResponse } from '@/types/notification';

type FilterType = 'all' | 'unread';

/**
 * 알림함 페이지
 */
export default function NotificationPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    currentPage,
    fetchNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    void fetchNotifications(0);
  }, [fetchNotifications]);

  // 필터링된 알림
  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

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
    }
  };

  const handleMarkAllRead = (): void => {
    void handleMarkAllAsRead();
  };

  const handleToggleSelect = (notificationId: number): void => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = (): void => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(filteredNotifications.map((n) => n.notificationId))
      );
    }
  };

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedIds.size === 0) return;

    if (!window.confirm(`선택한 ${selectedIds.size}개의 알림을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await Promise.all(Array.from(selectedIds).map((id) => handleDelete(id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to delete selected notifications:', err);
    }
  };

  const handleDeleteClick = async (
    e: React.MouseEvent,
    notificationId: number
  ): Promise<void> => {
    e.stopPropagation();
    if (!window.confirm('이 알림을 삭제하시겠습니까?')) {
      return;
    }
    try {
      await handleDelete(notificationId);
      selectedIds.delete(notificationId);
      setSelectedIds(new Set(selectedIds));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="mx-auto max-w-5xl px-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">알림함</h1>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600">
              전체 {notifications.length}건 · 안 읽음 {unreadCount}건
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  전체
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    filter === 'unread'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  안 읽음
                </button>
              </div>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  선택 삭제 ({selectedIds.size})
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  전체 읽음 처리
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {error && (
            <div className="p-8 text-center text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {isLoading && notifications.length === 0 && (
            <div className="flex items-center justify-center p-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          )}

          {!isLoading && filteredNotifications.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-900 mb-1">
                {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
              </p>
              <p className="text-sm text-slate-500">
                새로운 알림이 도착하면 여기에 표시됩니다
              </p>
            </div>
          )}

          {filteredNotifications.length > 0 && (
            <>
              {/* 전체 선택 */}
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredNotifications.length}
                    onChange={handleToggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    전체 선택
                  </span>
                </label>
              </div>

              {/* 알림 아이템 */}
              {filteredNotifications.map((notification) => {
                return (
                  <div
                    key={notification.notificationId}
                    className={`border-b border-slate-100 transition-colors ${
                      !notification.isRead ? 'bg-indigo-50/30' : 'bg-white'
                    } ${selectedIds.has(notification.notificationId) ? 'bg-slate-50' : ''}`}
                  >
                    <div className="flex items-start gap-4 px-6 py-4">
                      {/* 체크박스 */}
                      <input
                        type="checkbox"
                        checked={selectedIds.has(notification.notificationId)}
                        onChange={() => handleToggleSelect(notification.notificationId)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                      />

                      {/* 알림 내용 */}
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="flex-1 text-left cursor-pointer"
                      >
                        {/* 첫 번째 줄: 안 읽음 점 + 타이틀 + 시간 */}
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                              !notification.isRead ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-base font-bold text-slate-900 flex-1">
                            {notification.title}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>

                        {/* 두 번째 줄: 바디 */}
                        <p className="mb-2 text-sm text-slate-600 leading-relaxed pl-4">
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
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors"
                        aria-label="더보기"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 더 보기 */}
              {hasMore && (
                <div className="p-6">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? '로딩 중...' : '더 보기'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
