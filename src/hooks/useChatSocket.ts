import { useEffect, useRef, useCallback, useState } from 'react';
import { Client, type StompSubscription, type IMessage, type IFrame } from '@stomp/stompjs';
import { getAccessToken } from '@/utils/auth';
import type {
  ChatRealtimeEvent,
  ChatSendMessageRequest,
  ConnectionStatus,
} from '@/types';

interface UseChatSocketOptions {
  onEvent?: (event: ChatRealtimeEvent) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

export const useChatSocket = ({ onEvent, onConnectionChange }: UseChatSocketOptions = {}) => {
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');

  const updateConnectionStatus = useCallback(
    (status: ConnectionStatus) => {
      setConnectionStatus(status);
      onConnectionChange?.(status);
    },
    [onConnectionChange]
  );

  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      return;
    }

    updateConnectionStatus('CONNECTING');

    const token = getAccessToken();
    if (!token) {
      console.error('No access token available');
      updateConnectionStatus('DISCONNECTED');
      return;
    }

    const cleanToken = token.replace(/^"(.*)"$/, '$1').replace(/^Bearer\s+/, '');
    const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/ws';

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${cleanToken}`,
      },
      debug: (str: string) => {
        if (import.meta.env.DEV) {
          console.log('[STOMP]', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');
        updateConnectionStatus('CONNECTED');

        // 실시간 이벤트 구독
        subscriptionRef.current = client.subscribe('/user/queue/chat', (message: IMessage) => {
          try {
            const event: ChatRealtimeEvent = JSON.parse(message.body);
            onEvent?.(event);
          } catch (error) {
            console.error('Failed to parse chat event:', error);
          }
        });
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus('DISCONNECTED');
      },
      onStompError: (frame: IFrame) => {
        console.error('STOMP error:', frame);
        updateConnectionStatus('DISCONNECTED');
      },
      onWebSocketError: (event: Event) => {
        console.error('WebSocket error:', event);
        updateConnectionStatus('DISCONNECTED');
      },
    });

    client.activate();
    clientRef.current = client;
  }, [updateConnectionStatus, onEvent]);

  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }

    updateConnectionStatus('DISCONNECTED');
  }, [updateConnectionStatus]);

  const sendMessage = useCallback((request: ChatSendMessageRequest) => {
    if (!clientRef.current?.connected) {
      console.error('WebSocket is not connected');
      return;
    }

    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(request),
    });
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    sendMessage,
    connect,
    disconnect,
  };
};
