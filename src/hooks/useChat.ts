import { useState, useCallback, useEffect, useRef } from 'react';
import { useChatSocket } from './useChatSocket';
import { createChatThread, getMyChatThreads, getChatMessages } from '@/api';
import { getStorePublicId } from '@/utils/store';
import type {
  ChatThreadSummary,
  ChatMessage,
  ChatRealtimeEvent,
  ConnectionStatus,
} from '@/types';

export const useChat = () => {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 실시간 이벤트 처리
  const handleRealtimeEvent = useCallback((event: ChatRealtimeEvent) => {
    console.log('Realtime event:', event);

    switch (event.eventType) {
      case 'USER_MESSAGE_ACCEPTED':
        // clientMessageId를 서버 messageId로 매핑
        if (event.requestMessageId && event.clientMessageId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.clientMessageId === event.clientMessageId && msg.messageId < 0
                ? { ...msg, messageId: event.requestMessageId!, status: 'QUEUED' }
                : msg
            )
          );
        }
        break;

      case 'CHAT_PROCESSING':
        // 로딩 상태로 변경
        if (event.requestMessageId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.messageId === event.requestMessageId
                ? { ...msg, status: 'PROCESSING' as const }
                : msg
            )
          );
        }
        break;

      case 'CHAT_RESPONSE_CREATED':
        // 응답 메시지 추가
        if (event.message) {
          setMessages((prev) => {
            // 요청 메시지 상태 업데이트
            const updated = prev.map((msg) =>
              msg.messageId === event.requestMessageId
                ? { ...msg, status: 'COMPLETED' as const }
                : msg
            );
            // 응답 메시지 추가
            return [...updated, event.message!];
          });

          // 스레드 목록 갱신 (마지막 메시지 업데이트)
          loadThreads();
        }
        break;

      case 'CHAT_FAILED':
        // 실패 상태로 변경
        if (event.requestMessageId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.messageId === event.requestMessageId
                ? { ...msg, status: 'FAILED' as const, errorMessage: event.errorMessage || '오류가 발생했습니다' }
                : msg
            )
          );
        }
        break;
    }
  }, []);

  const { sendMessage } = useChatSocket({
    onEvent: handleRealtimeEvent,
    onConnectionChange: setConnectionStatus,
  });

  // 스레드 목록 로드
  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    try {
      const response = await getMyChatThreads();
      setThreads(response.data);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  // 메시지 로드
  const loadMessages = useCallback(async (threadId: number) => {
    setIsLoadingMessages(true);
    try {
      const response = await getChatMessages(threadId);
      // 최신순으로 받아온 메시지를 시간순으로 정렬
      const sortedMessages = [...response.data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // 새 대화 생성
  const createNewThread = useCallback(async (title: string = '새 대화') => {
    const storePublicId = getStorePublicId();
    if (!storePublicId) {
      console.error('No store selected');
      return null;
    }

    try {
      const response = await createChatThread(storePublicId, { title });
      const newThread = response.data;

      // 스레드 목록 갱신
      await loadThreads();

      // 새 스레드 선택
      setSelectedThreadId(newThread.threadId);
      setMessages([]);

      return newThread.threadId;
    } catch (error) {
      console.error('Failed to create thread:', error);
      return null;
    }
  }, [loadThreads]);

  // 메시지 전송
  const sendChatMessage = useCallback(
    (content: string) => {
      if (!selectedThreadId || !content.trim()) {
        return;
      }

      const clientMessageId = `client-${Date.now()}-${Math.random()}`;

      // 낙관적 UI 업데이트
      const optimisticMessage: ChatMessage = {
        messageId: -Date.now(), // 임시 음수 ID
        threadId: selectedThreadId,
        role: 'USER',
        status: 'QUEUED',
        content: content.trim(),
        clientMessageId,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // WebSocket으로 전송
      sendMessage({
        threadId: selectedThreadId,
        clientMessageId,
        content: content.trim(),
      });

      // 스크롤
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    [selectedThreadId, sendMessage]
  );

  // 메시지 재전송
  const retryMessage = useCallback(
    (message: ChatMessage) => {
      if (!message.clientMessageId) {
        return;
      }

      // 기존 메시지를 QUEUED 상태로 변경
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === message.messageId
            ? { ...msg, status: 'QUEUED', errorMessage: null }
            : msg
        )
      );

      // 재전송
      sendMessage({
        threadId: message.threadId,
        clientMessageId: message.clientMessageId,
        content: message.content,
      });
    },
    [sendMessage]
  );

  // 스레드 선택
  const selectThread = useCallback(
    (threadId: number) => {
      setSelectedThreadId(threadId);
      loadMessages(threadId);
    },
    [loadMessages]
  );

  // 초기 로드
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // 선택된 스레드의 메시지 로드
  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
    }
  }, [selectedThreadId, loadMessages]);

  return {
    threads,
    selectedThreadId,
    messages,
    isLoadingThreads,
    isLoadingMessages,
    connectionStatus,
    messagesEndRef,
    createNewThread,
    selectThread,
    sendChatMessage,
    retryMessage,
    loadThreads,
  };
};
