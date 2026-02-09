import { ReactNode } from "react";

interface AlertCardProps {
  type: "warning" | "danger" | "info";
  title: string;
  items: {
    id: string;
    label: string;
    value: string | number;
    subValue?: string;
  }[];
  onViewAll?: () => void;
}

const alertTypeStyles = {
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    badge: "bg-amber-100 text-amber-700",
  },
  danger: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    titleColor: "text-rose-900",
    badge: "bg-rose-100 text-rose-700",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
    badge: "bg-blue-100 text-blue-700",
  },
};

function IconAlert({ type }: { type: "warning" | "danger" | "info" }) {
  if (type === "danger") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (type === "warning") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function AlertCard({
  type,
  title,
  items,
  onViewAll,
}: AlertCardProps) {
  const styles = alertTypeStyles[type];

  if (items.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border ${styles.border} ${styles.bg} p-4 transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg ${styles.iconBg} ${styles.iconColor} p-1.5`}>
            <IconAlert type={type} />
          </div>
          <h3 className={`font-bold text-sm ${styles.titleColor}`}>{title}</h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
            {items.length}
          </span>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            전체보기
          </button>
        )}
      </div>

      <div className="space-y-2">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2"
          >
            <span className="text-sm font-medium text-slate-700">{item.label}</span>
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{item.value}</span>
              {item.subValue && (
                <span className="text-xs text-slate-500">{item.subValue}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length > 3 && (
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            +{items.length - 3}개 더보기
          </button>
        </div>
      )}
    </div>
  );
}
