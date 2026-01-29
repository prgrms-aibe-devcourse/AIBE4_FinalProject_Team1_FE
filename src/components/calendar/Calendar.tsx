import { useMemo } from "react";
import type { DayData, CalendarCell } from "./types";
import { cn, formatKRW, formatNum, sumIncome, sumExpense, toISODate } from "./utils";

type CalendarProps = {
    year: number;
    month0: number; // 0-indexed
    dataMap: Map<string, DayData>;
    selectedDate: string;
    onSelectDate: (date: string) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
    onRecordClick?: () => void;
    onReceiptScanClick?: () => void;
};

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

export default function Calendar({
                                     year,
                                     month0,
                                     dataMap,
                                     selectedDate,
                                     onSelectDate,
                                     onPrevMonth,
                                     onNextMonth,
                                     onToday,
                                     onRecordClick,
                                     onReceiptScanClick,
                                 }: CalendarProps) {
    const firstDay = useMemo(() => new Date(year, month0, 1), [year, month0]);
    const daysInMonth = useMemo(() => new Date(year, month0 + 1, 0).getDate(), [year, month0]);
    const startWeekday = useMemo(() => firstDay.getDay(), [firstDay]);

    const monthLabel = useMemo(() => `${year}년 ${month0 + 1}월`, [year, month0]);
    const monthKey = useMemo(() => `${year}-${String(month0 + 1).padStart(2, "0")}`, [year, month0]);

    const monthTxs = useMemo(() => {
        const all: DayData["txs"] = [];
        for (const [date, day] of dataMap.entries()) {
            if (date.startsWith(monthKey)) all.push(...day.txs);
        }
        return all;
    }, [dataMap, monthKey]);

    const monthIncome = useMemo(() => sumIncome(monthTxs), [monthTxs]);
    const monthExpense = useMemo(() => sumExpense(monthTxs), [monthTxs]);
    const monthNet = useMemo(() => monthIncome - monthExpense, [monthIncome, monthExpense]);

    const gridCells = useMemo(() => {
        const cells: CalendarCell[] = [];
        const total = startWeekday + daysInMonth;
        const rows = Math.ceil(total / 7);
        const cellCount = rows * 7;

        for (let i = 0; i < cellCount; i += 1) {
            const dayNum = i - startWeekday + 1;
            if (dayNum < 1 || dayNum > daysInMonth) {
                cells.push({});
            } else {
                cells.push({ day: dayNum, iso: toISODate(year, month0, dayNum) });
            }
        }
        return cells;
    }, [startWeekday, daysInMonth, year, month0]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="text-xl font-extrabold text-slate-900">{monthLabel}</div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={onPrevMonth}
                            className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold"
                            aria-label="이전"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            onClick={onNextMonth}
                            className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold"
                            aria-label="다음"
                        >
                            ›
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onToday}
                        className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700"
                    >
                        오늘
                    </button>
                </div>
            </div>

            {/* 월별 요약: 수입/지출/합계 */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white">
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-500">수입</div>
                        <div className="mt-1 text-base font-extrabold text-blue-700 [font-variant-numeric:tabular-nums]">
                            {formatKRW(monthIncome)}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-500">지출</div>
                        <div className="mt-1 text-base font-extrabold text-rose-600 [font-variant-numeric:tabular-nums]">
                            {formatKRW(monthExpense)}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-500">합계</div>
                        <div
                            className={cn(
                                "mt-1 text-base font-extrabold [font-variant-numeric:tabular-nums]",
                                monthNet >= 0 ? "text-slate-900" : "text-rose-600"
                            )}
                        >
                            {monthNet >= 0 ? formatKRW(monthNet) : `-${formatKRW(Math.abs(monthNet))}`}
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                {/* 요일 */}
                <div className="grid grid-cols-7 text-xs font-extrabold text-slate-500 mb-2">
                    {weekdayLabels.map((w, idx) => (
                        <div
                            key={w}
                            className={cn("px-1", idx === 0 && "text-rose-600", idx === 6 && "text-blue-700")}
                        >
                            {w}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {gridCells.map((cell, idx) => {
                        const iso = cell.iso;
                        const dayNum = cell.day;
                        const day = iso ? dataMap.get(iso) : undefined;

                        const txs = day?.txs ?? [];
                        const income = sumIncome(txs);
                        const expense = sumExpense(txs);

                        const isSelected = !!iso && iso === selectedDate;

                        return (
                            <button
                                key={idx}
                                type="button"
                                disabled={!iso}
                                onClick={() => iso && onSelectDate(iso)}
                                className={cn(
                                    "h-[98px] rounded-2xl border text-left p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-0",
                                    iso ? "border-slate-200 hover:bg-slate-50 bg-white" : "border-transparent bg-transparent",
                                    isSelected && "border-slate-300 bg-slate-50 shadow-sm"
                                )}
                            >
                                {dayNum ? (
                                    <div className="flex flex-col h-full">
                                        <div className="text-sm font-extrabold text-slate-900">{dayNum}</div>

                                        <div className="mt-auto space-y-1">
                                            {income > 0 && (
                                                <div className="inline-flex max-w-full truncate items-center px-2 py-1 rounded-lg text-[11px] font-extrabold text-blue-700 [font-variant-numeric:tabular-nums]">
                                                    +{formatNum(income)}
                                                </div>
                                            )}
                                            {expense > 0 && (
                                                <div className="inline-flex max-w-full truncate items-center px-2 py-1 rounded-lg text-[11px] font-extrabold text-rose-600 [font-variant-numeric:tabular-nums]">
                                                    -{formatNum(expense)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </button>
                        );
                    })}
                </div>

                {/* 하단 CTA */}
                {(onRecordClick || onReceiptScanClick) && (
                    <div className="mt-4 flex justify-end gap-2">
                        {onRecordClick && (
                            <button
                                type="button"
                                onClick={onRecordClick}
                                className="h-11 px-4 rounded-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold shadow-sm hover:bg-slate-50 active:translate-y-[1px] transition"
                            >
                                + 지출/수입 기록
                            </button>
                        )}
                        {onReceiptScanClick && (
                            <button
                                type="button"
                                onClick={onReceiptScanClick}
                                className="h-11 px-4 rounded-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold shadow-sm hover:bg-slate-50 active:translate-y-[1px] transition"
                            >
                                영수증 스캔
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
