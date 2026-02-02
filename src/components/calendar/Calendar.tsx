import {useMemo, useRef, useEffect} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {DayData} from "./types";
import {cn, formatKRW, formatNum, sumIncome, sumExpense} from "./utils";

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
    const calendarRef = useRef<FullCalendar>(null);

    const monthLabel = useMemo(() => `${year}년 ${month0 + 1}월`, [year, month0]);
    const monthKey = useMemo(() => `${year}-${String(month0 + 1).padStart(2, "0")}`, [year, month0]);

    // 1. 월별 합계 계산 (기존 로직 유지)
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

    // 2. FullCalendar용 이벤트 데이터로 변환
    const events = useMemo(() => {
        const evtList = [];
        for (const [date, dayData] of dataMap.entries()) {
            const income = sumIncome(dayData.txs);
            const expense = sumExpense(dayData.txs);

            // 수입 (파란색)
            if (income > 0) {
                evtList.push({
                    title: `+${formatNum(income)}`,
                    start: date,
                    textColor: '#1d4ed8', // blue-700 (파랑)
                    classNames: ['font-extrabold', 'text-[11px]', 'income-event'],
                    display: 'list-item'
                });
            }
            // 지출 (빨간색)
            if (expense > 0) {
                evtList.push({
                    title: `-${formatNum(expense)}`,
                    start: date,
                    textColor: '#e11d48', // rose-600 (빨강)
                    classNames: ['font-extrabold', 'text-[11px]', 'expense-event'],
                    display: 'list-item'
                });
            }
        }
        return evtList;
    }, [dataMap]);

    // 3. Props(year, month0)가 바뀌면 캘린더 날짜도 이동
    useEffect(() => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            const currentDate = calendarApi.getDate();
            const targetDate = new Date(year, month0, 1);

            // 달이 다를 때만 이동
            if (currentDate.getMonth() !== targetDate.getMonth() || currentDate.getFullYear() !== targetDate.getFullYear()) {
                calendarApi.gotoDate(targetDate);
            }
        }
    }, [year, month0]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full">
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

            {/* 월별 요약 */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white">
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-500">수입</div>
                        <div
                            className="mt-1 text-base font-extrabold text-blue-700 [font-variant-numeric:tabular-nums]">
                            {formatKRW(monthIncome)}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-500">지출</div>
                        <div
                            className="mt-1 text-base font-extrabold text-rose-600 [font-variant-numeric:tabular-nums]">
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

            {/* FullCalendar */}
            <div className="p-4 flex-1 calendar-wrapper">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale="ko"
                    headerToolbar={false}
                    events={events}
                    dateClick={(arg) => onSelectDate(arg.dateStr)}
                    height="auto"
                    contentHeight="auto"
                    dayCellClassNames={(arg) => {
                        const offset = arg.date.getTimezoneOffset() * 60000;
                        const localDate = new Date(arg.date.getTime() - offset);
                        const dateStr = localDate.toISOString().split('T')[0];

                        return dateStr === selectedDate
                            ? 'fc-day-selected'
                            : '';
                    }}
                    fixedWeekCount={false}
                    showNonCurrentDates={false}
                />

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
