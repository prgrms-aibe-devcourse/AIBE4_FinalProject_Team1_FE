/**
 * JSON 값 타입
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

/**
 * 알림 타입
 */
export type NotificationType =
  | 'INVENTORY_BELOW_THRESHOLD'
  | 'INVENTORY_SHORTAGE_DETECTED'
  | 'MONTHLY_OPS_REPORT_READY'
  | 'STORE_MEMBER_REGISTERED'
  | 'STORE_MEMBER_JOINED';

/**
 * 알림 메타데이터
 */
export type NotificationMetadata = Record<string, string | number | boolean | null>;

/**
 * 알림 응답
 */
export interface NotificationResponse {
  notificationId: number;
  type: NotificationType;
  title: string;
  message: string;
  deepLink: string;
  isRead: boolean;
  readAt: string | null;
  metadata: NotificationMetadata;
  createdAt: string;
}

/**
 * 알림 액션 응답
 */
export interface NotificationActionResponse {
  success: boolean;
  action: string;
  notificationId: number | null;
  affectedCount: number | null;
}

/**
 * SSE 이벤트 타입
 */
export type SSEEventType = 'connect' | 'notification';

/**
 * SSE 이벤트 데이터
 */
export interface SSEEventData {
  type: SSEEventType;
  data?: NotificationResponse;
  message?: string;
}
