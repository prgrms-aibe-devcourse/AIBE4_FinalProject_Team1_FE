import { useChat } from '@/hooks/useChat';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatComposer } from '@/components/chat/ChatComposer';

export const ChatPage = () => {
  const {
    threads,
    selectedThreadId,
    messages,
    isLoadingThreads,
    isLoadingMessages,
    connectionStatus,
    createNewThread,
    selectThread,
    sendChatMessage,
    retryMessage,
  } = useChat();

  const handleNewChat = async () => {
    await createNewThread('새 대화');
  };

  const handleQuickQuestion = (question: string) => {
    sendChatMessage(question);
  };

  const handleSendMessage = (content: string) => {
    // 선택된 스레드가 없으면 새 스레드 생성 후 메시지 전송
    if (!selectedThreadId) {
      createNewThread('새 대화').then((threadId) => {
        if (threadId) {
          // 스레드가 생성되면 메시지 전송 (useChat hook이 자동으로 처리)
          setTimeout(() => sendChatMessage(content), 500);
        }
      });
    } else {
      sendChatMessage(content);
    }
  };

  // 현재 처리 중인 메시지가 있는지 확인
  const isProcessing = messages.some(
    (msg) => msg.status === 'PROCESSING' || msg.status === 'QUEUED'
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측 사이드바 */}
      <ChatSidebar
        threads={threads}
        selectedThreadId={selectedThreadId}
        onSelectThread={selectThread}
        onNewChat={handleNewChat}
        isLoading={isLoadingThreads}
      />

      {/* 우측 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-white">
        {/* 헤더 */}
        <ChatHeader
          connectionStatus={connectionStatus}
          isProcessing={isProcessing}
        />

        {/* 메시지 리스트 */}
        <ChatMessageList
          messages={messages}
          isLoading={isLoadingMessages}
          onRetry={retryMessage}
          onQuickQuestion={handleQuickQuestion}
        />

        {/* 입력 영역 */}
        <ChatComposer
          onSend={handleSendMessage}
          disabled={connectionStatus !== 'CONNECTED'}
        />
      </div>
    </div>
  );
};

export default ChatPage;
