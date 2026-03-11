import apiClient from './user/client.ts';
import type { PageResponse } from '@/types/common/common.ts';
import type {
  NotificationResponse,
  NotificationActionResponse,
} from '@/types/notification.ts';

/**
 * 알림 목록 조회
 * GET /api/notifications
 */
export async function getNotifications(params: {
  page?: number;
  size?: number;
}): Promise<PageResponse<NotificationResponse>> {
  const response = await apiClient.get('/api/notifications', {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: 'createdAt,desc',
    },
  });
  return response.data;
}

/**
 * 안 읽은 알림 개수 조회
 * GET /api/notifications/unread-count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<number>('/api/notifications/unread-count');
  return response.data;
}

/**
 * 알림 개별 읽음 처리
 * PATCH /api/notifications/{notificationId}/read
 */
export async function markAsRead(
  notificationId: number
): Promise<NotificationActionResponse> {
  const response = await apiClient.patch(
    `/api/notifications/${notificationId}/read`
  );
  return response.data;
}

/**
 * 알림 전체 읽음 처리
 * PATCH /api/notifications/read-all
 */
export async function markAllAsRead(): Promise<NotificationActionResponse> {
  const response = await apiClient.patch('/api/notifications/read-all');
  return response.data;
}

/**
 * 알림 삭제
 * DELETE /api/notifications/{notificationId}
 */
export async function deleteNotification(
  notificationId: number
): Promise<NotificationActionResponse> {
  const response = await apiClient.delete(`/api/notifications/${notificationId}`);
  return response.data;
}
