import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
}

/**
 * 알림 벨 컴포넌트
 * 헤더에 표시되며 클릭 시 알림함 페이지로 이동
 */
export default function NotificationBell({ unreadCount }: NotificationBellProps) {
  const navigate = useNavigate();

  const handleClick = (): void => {
    navigate('/notifications');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 grid place-items-center transition-colors"
      aria-label="알림"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
