import type { ConnectionStatus } from '@/types';

interface ChatStatusBadgeProps {
  status: ConnectionStatus;
  isProcessing?: boolean;
}

export const ChatStatusBadge = ({ status, isProcessing }: ChatStatusBadgeProps) => {
  const getStatusInfo = () => {
    if (isProcessing) {
      return {
        text: '답변 생성 중',
        dotColor: 'bg-yellow-500',
        animation: 'animate-pulse',
      };
    }

    switch (status) {
      case 'CONNECTED':
        return {
          text: '응답 가능',
          dotColor: 'bg-emerald-500',
          animation: '',
        };
      case 'CONNECTING':
        return {
          text: '연결 중',
          dotColor: 'bg-yellow-500',
          animation: 'animate-pulse',
        };
      case 'RECONNECTING':
        return {
          text: '연결 재시도 중',
          dotColor: 'bg-orange-500',
          animation: 'animate-pulse',
        };
      case 'DISCONNECTED':
        return {
          text: '연결 끊김',
          dotColor: 'bg-red-500',
          animation: '',
        };
    }
  };

  const { text, dotColor, animation } = getStatusInfo();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full text-sm">
      <div className={`w-2 h-2 rounded-full ${dotColor} ${animation}`} />
      <span className="text-gray-700 font-medium">{text}</span>
    </div>
  );
};
