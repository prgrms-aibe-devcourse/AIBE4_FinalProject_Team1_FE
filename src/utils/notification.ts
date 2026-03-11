import type { NotificationResponse } from '@/types/notification';

/**
 * 상대 시간 포맷 (방금 전, 3분 전 등)
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return formatAbsoluteDateTime(dateString);
}

/**
 * 절대 날짜/시간 포맷 (2026.03.10 19:25)
 */
export function formatAbsoluteDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

/**
 * 알림 타입별 스타일
 */
export function getTypeColor(type: NotificationResponse['type']): string {
  switch (type) {
    case 'INVENTORY_BELOW_THRESHOLD':
    case 'INVENTORY_SHORTAGE_DETECTED':
      return 'text-red-600 bg-red-50';
    case 'MONTHLY_OPS_REPORT_READY':
      return 'text-blue-600 bg-blue-50';
    case 'STORE_MEMBER_REGISTERED':
    case 'STORE_MEMBER_JOINED':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
