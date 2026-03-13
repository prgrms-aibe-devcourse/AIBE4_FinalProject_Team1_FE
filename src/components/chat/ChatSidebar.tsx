import { PlusCircle, MessageSquare } from 'lucide-react';
import type { ChatThreadSummary } from '@/types';

interface ChatSidebarProps {
  threads: ChatThreadSummary[];
  selectedThreadId: number | null;
  onSelectThread: (threadId: number) => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

export const ChatSidebar = ({
  threads,
  selectedThreadId,
  onSelectThread,
  onNewChat,
  isLoading,
}: ChatSidebarProps) => {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-sky-200 text-sky-600 rounded-xl hover:bg-sky-50 hover:border-sky-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        >
          <PlusCircle className="w-5 h-5" />
          새 대화 시작
        </button>
      </div>

      {/* 스레드 목록 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        ) : threads.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              아직 대화가 없습니다.
              <br />
              새 대화를 시작해보세요!
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {threads.map((thread) => (
              <button
                key={thread.threadId}
                onClick={() => onSelectThread(thread.threadId)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedThreadId === thread.threadId
                    ? 'bg-white shadow-sm border border-sky-200'
                    : 'hover:bg-white/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                    {thread.title}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatDate(thread.lastMessageAt || thread.createdAt)}
                  </span>
                </div>
                {thread.lastMessagePreview && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {thread.lastMessagePreview}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
