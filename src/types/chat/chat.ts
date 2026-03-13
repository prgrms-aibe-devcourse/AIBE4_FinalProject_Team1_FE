// 챗봇 메시지 역할
export type ChatMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';

// 챗봇 메시지 상태
export type ChatMessageStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// 챗봇 스레드 상태
export type ChatThreadStatus = 'ACTIVE' | 'ARCHIVED';

// 실시간 이벤트 타입
export type ChatRealtimeEventType =
  | 'USER_MESSAGE_ACCEPTED'
  | 'CHAT_PROCESSING'
  | 'CHAT_RESPONSE_CREATED'
  | 'CHAT_FAILED';

// 연결 상태
export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

// 챗봇 메시지
export interface ChatMessage {
  messageId: number;
  threadId: number;
  role: ChatMessageRole;
  status: ChatMessageStatus;
  content: string;
  clientMessageId?: string;
  replyToMessageId?: number | null;
  model?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

// 챗봇 스레드 요약
export interface ChatThreadSummary {
  threadId: number;
  title: string;
  status: ChatThreadStatus;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
}

// 챗봇 스레드 생성 응답
export interface ChatThreadCreateResponse {
  threadId: number;
  title: string;
  status: ChatThreadStatus;
  createdAt: string;
}

// 챗봇 실시간 이벤트
export interface ChatRealtimeEvent {
  eventType: ChatRealtimeEventType;
  threadId: number;
  requestMessageId?: number | null;
  clientMessageId?: string | null;
  requestStatus?: ChatMessageStatus | null;
  message?: ChatMessage | null;
  errorMessage?: string | null;
  occurredAt: string;
}

// 챗봇 메시지 전송 요청
export interface ChatSendMessageRequest {
  threadId: number;
  clientMessageId: string;
  content: string;
}

// 챗봇 스레드 생성 요청
export interface ChatCreateThreadRequest {
  title: string;
}
