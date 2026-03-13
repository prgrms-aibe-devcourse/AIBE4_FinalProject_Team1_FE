import { MoreVertical, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChatStatusBadge } from './ChatStatusBadge';
import type { ConnectionStatus } from '@/types';

interface ChatHeaderProps {
  connectionStatus: ConnectionStatus;
  isProcessing?: boolean;
}

export const ChatHeader = ({
  connectionStatus,
  isProcessing = false,
}: ChatHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* 좌측: 돌아가기 버튼 & 챗봇 정보 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm font-medium"
            title="대시보드로 돌아가기"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>돌아가기</span>
          </button>

          <div className="w-px h-8 bg-gray-200 mx-1" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md ring-1 ring-gray-100 bg-gray-50 flex items-center justify-center">
              <img
                src="/images/chatbot.png"
                alt="수셰프"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">수셰프</h2>
              <ChatStatusBadge status={connectionStatus} isProcessing={isProcessing} />
            </div>
          </div>
        </div>

        {/* 우측: 액션 버튼 */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
