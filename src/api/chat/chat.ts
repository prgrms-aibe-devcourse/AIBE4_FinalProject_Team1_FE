import apiClient from '../user/client';
import type {
  ChatThreadCreateResponse,
  ChatThreadSummary,
  ChatMessage,
  ChatCreateThreadRequest,
} from '@/types';

// 채팅 스레드 생성
export const createChatThread = (storePublicId: string, request: ChatCreateThreadRequest) =>
  apiClient.post<ChatThreadCreateResponse>(`/api/chat/${storePublicId}/threads`, request);

// 내 채팅 스레드 목록 조회
export const getMyChatThreads = () =>
  apiClient.get<ChatThreadSummary[]>('/api/chat/threads');

// 채팅 스레드 메시지 조회
export const getChatMessages = (threadId: number, cursor?: number) =>
  apiClient.get<ChatMessage[]>(`/api/chat/threads/${threadId}/messages`, {
    params: cursor ? { cursor } : undefined,
  });
