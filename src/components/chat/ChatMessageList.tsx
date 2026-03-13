import { useEffect, useRef } from 'react';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatWelcomePanel } from './ChatWelcomePanel';
import type { ChatMessage } from '@/types';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onRetry?: (message: ChatMessage) => void;
  onQuickQuestion?: (question: string) => void;
}

export const ChatMessageList = ({
  messages,
  isLoading,
  onRetry,
  onQuickQuestion,
}: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 새 메시지가 추가되면 스크롤
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // 메시지가 없으면 웰컴 화면 표시
  if (messages.length === 0 && !isLoading) {
    return <ChatWelcomePanel onQuickQuestion={onQuickQuestion || (() => { })} />;
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
      <div className="max-w-4xl mx-auto">
        {/* 상단 상시 노출 영역: 챗봇 얼굴 & 안내 (ChatWelcomePanel과 동일한 구성) */}
        <div className="flex flex-col items-center mb-10 pt-4 animate-in fade-in duration-700">
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-50 flex items-center justify-center ring-1 ring-gray-100">
              <img
                src="/images/chatbot.png"
                alt="수셰프"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-gray-900 italic">수셰프 <span className="text-sky-500 not-italic">AI</span></h1>
            <p className="text-gray-500 text-base">무엇을 도와드릴까요? 재고, 매출, 발주에 대해 물어보세요.</p>
          </div>

          {/* 퀵 질문 버튼 (상시 노출) */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {[
              { text: '오늘 재고 현황', query: '오늘 재고 현황을 알려줘' },
              { text: '이번 주 매출', query: '이번 주 매출을 알려줘' },
              { text: '자동 발주 필요 품목', query: '자동 발주가 필요한 품목을 알려줘' },
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => onQuickQuestion?.(item.query)}
                className="px-5 py-2.5 bg-white border border-sky-100 text-sky-600 rounded-full hover:bg-sky-50 hover:border-sky-300 transition-all duration-200 text-sm font-medium shadow-sm"
              >
                {item.text}
              </button>
            ))}
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent my-10" />
        </div>

        {messages.map((message) => (
          <ChatMessageBubble
            key={message.messageId}
            message={message}
            onRetry={onRetry}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex gap-3 max-w-[70%]">
              <div className="flex-shrink-0 w-10 h-10 border border-gray-100 rounded-full overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center">
                <img
                  src="/images/chatbot.png"
                  alt="수셰프"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
