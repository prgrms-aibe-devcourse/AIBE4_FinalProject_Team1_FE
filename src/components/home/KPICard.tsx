interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
}

function IconTrendUp() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconTrendDown() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12.577 15.122a.75.75 0 00.919.53l4.78-1.281a.75.75 0 00.531-.919l-1.281-4.78a.75.75 0 00-1.449.387l.81 3.022a19.407 19.407 0 01-5.594-5.203.75.75 0 00-1.139-.093L7 9.94l-4.72-4.72a.75.75 0 00-1.06 1.061l5.25 5.25a.75.75 0 001.06 0l3.074-3.073a20.923 20.923 0 004.931 5.545l-3.042.815a.75.75 0 00-.53.919z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function KPICard({
  title,
  value,
  unit,
  change,
  icon,
  trend,
  onClick,
}: KPICardProps) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 bg-white p-5 transition-all ${
        onClick ? "cursor-pointer hover:shadow-lg hover:border-slate-300" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-semibold text-slate-600">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
        {unit && <span className="text-lg font-medium text-slate-500 mb-1">{unit}</span>}
      </div>

      {change && (
        <div className="flex items-center gap-1.5">
          {isPositive && (
            <div className="flex items-center gap-0.5 text-emerald-600">
              <IconTrendUp />
              <span className="text-xs font-bold">+{change.value}%</span>
            </div>
          )}
          {isNegative && (
            <div className="flex items-center gap-0.5 text-rose-600">
              <IconTrendDown />
              <span className="text-xs font-bold">{change.value}%</span>
            </div>
          )}
          {!isPositive && !isNegative && (
            <span className="text-xs font-semibold text-slate-500">
              {change.value > 0 ? "+" : ""}
              {change.value}%
            </span>
          )}
          <span className="text-xs text-slate-500">{change.label}</span>
        </div>
      )}
    </div>
  );
}
