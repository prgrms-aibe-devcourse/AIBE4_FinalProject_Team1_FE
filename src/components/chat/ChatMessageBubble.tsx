import { RefreshCw } from 'lucide-react';
import type { ChatMessage } from '@/types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onRetry?: (message: ChatMessage) => void;
}

export const ChatMessageBubble = ({ message, onRetry }: ChatMessageBubbleProps) => {
  const isUser = message.role === 'USER';
  const isFailed = message.status === 'FAILED';
  const isProcessing = message.status === 'PROCESSING' || message.status === 'QUEUED';

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = () => {
    // 섹션별로 구분하여 렌더링
    const sections = message.content.split(/\n(?=###\s)/).filter(Boolean);

    if (sections.length > 1 || message.content.includes('###')) {
      return (
        <div className="space-y-3">
          {sections.map((section, index) => {
            const lines = section.split('\n').filter(Boolean);
            const titleLine = lines[0];
            const isSectionTitle = titleLine.startsWith('### ');

            if (isSectionTitle) {
              const title = titleLine.replace(/^###\s*/, '');
              const content = lines.slice(1).join('\n');

              return (
                <div key={index} className="space-y-2">
                  <h4 className="text-sm font-semibold text-sky-600">{title}</h4>
                  {content && (
                    <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {content}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={index} className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {section}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className={`${isUser ? 'text-gray-800' : 'text-gray-700'} whitespace-pre-wrap text-sm leading-relaxed`}>
        {message.content}
      </div>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex gap-3 max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="flex-shrink-0 w-10 h-10 border border-gray-100 rounded-full overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center">
            <img
              src="/images/chatbot.png"
              alt="수셰프"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div
            className={`px-4 py-3 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0,05)] transition-all ${isUser
              ? 'bg-white border-2 border-sky-100 text-gray-800 rounded-tr-sm'
              : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
              } ${isFailed ? 'border-red-200 bg-red-50/50' : ''}`}
          >
            {isFailed && (
              <div className="text-red-600 text-sm mb-2 font-medium">
                {message.errorMessage || '오류가 발생했습니다'}
              </div>
            )}
            {renderContent()}
          </div>

          <div className={`flex items-center gap-2 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
            {isProcessing && (
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {isFailed && onRetry && (
            <button
              onClick={() => onRetry(message)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 전송
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
