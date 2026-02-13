import type {ReactNode} from "react";

interface ActionButtonProps {
    label: string;
    description?: string;
    icon: ReactNode;
    onClick: () => void;
    variant?: "primary";
}

export default function ActionButton({
                                         label,
                                         description,
                                         icon,
                                         onClick,
                                     }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 p-4 w-full transition-all hover:shadow-lg hover:scale-[1.02]"
        >
            <div className="rounded-xl bg-slate-100 p-3 shrink-0">
                {icon}
            </div>
            <div className="flex-1 text-left">
                <div className="font-bold text-base">{label}</div>
                {description && (
                    <div className="text-xs text-slate-600 mt-0.5">{description}</div>
                )}
            </div>
            <svg className="h-5 w-5 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                />
            </svg>
        </button>
    );
}
