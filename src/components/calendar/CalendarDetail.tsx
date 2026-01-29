import { useMemo } from "react";
import type { DayData } from "./types";
import { cn, formatNum, sumIncome, sumExpense, parseISODate } from "./utils";

type CalendarDetailProps = {
    selectedDate: string;
    selectedData?: DayData;
};

export default function CalendarDetail({ selectedDate, selectedData }: CalendarDetailProps) {
    const selectedTitle = useMemo(() => {
        const { m, d } = parseISODate(selectedDate);
        return `${m + 1}월 ${d}일 상세 내역`;
    }, [selectedDate]);

    const txs = selectedData?.txs ?? [];
    const selectedIncomeTotal = useMemo(() => sumIncome(txs), [txs]);
    const selectedExpenseTotal = useMemo(() => sumExpense(txs), [txs]);
    const selectedNet = selectedIncomeTotal - selectedExpenseTotal;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-full">
            <div className="p-4 border-b border-slate-200">
                <div className="text-lg font-extrabold text-slate-900">{selectedTitle}</div>

                {/* 요약: 수입/지출/합계 */}
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                        <div className="text-sm font-semibold text-slate-700">수입</div>
                        <div className="text-sm font-extrabold text-blue-700 [font-variant-numeric:tabular-nums]">
                            {formatNum(selectedIncomeTotal)}원
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                        <div className="text-sm font-semibold text-slate-700">지출</div>
                        <div className="text-sm font-extrabold text-rose-600 [font-variant-numeric:tabular-nums]">
                            {formatNum(selectedExpenseTotal)}원
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm font-semibold text-slate-700">합계</div>

                        <div className="text-sm font-extrabold text-slate-900 [font-variant-numeric:tabular-nums]">
                            {selectedNet >= 0 ? `${formatNum(selectedNet)}원` : `-${formatNum(Math.abs(selectedNet))}원`}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* 거래 내역 */}
                <div className="space-y-2">
                    {txs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                            선택한 날짜의 내역이 없습니다.
                        </div>
                    ) : (
                        txs.map((tx) => {
                            const isExpense = tx.amount < 0;
                            const abs = Math.abs(tx.amount);

                            return (
                                <div
                                    key={tx.id}
                                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 p-3 hover:bg-slate-50"
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={cn(
                                                "h-10 w-10 rounded-xl grid place-items-center font-black border",
                                                isExpense ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-blue-50 text-blue-700 border-blue-100"
                                            )}
                                        >
                                            {isExpense ? "-" : "+"}
                                        </div>

                                        <div>
                                            <div className="text-sm font-extrabold text-slate-900">{tx.title}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {tx.category} · {tx.time}
                                            </div>
                                            {tx.method && <div className="text-xs text-slate-400 mt-0.5">{tx.method}</div>}
                                        </div>
                                    </div>

                                    <div
                                        className={cn(
                                            "text-sm font-extrabold [font-variant-numeric:tabular-nums]",
                                            isExpense ? "text-rose-600" : "text-blue-700"
                                        )}
                                    >
                                        {isExpense ? `-${formatNum(abs)}` : `+${formatNum(abs)}`}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 메모 */}
                <div className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-extrabold text-slate-900">메모</div>
                        <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                            편집
                        </button>
                    </div>

                    <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {selectedData?.memo?.trim() ? selectedData.memo : "메모가 없습니다. 오늘의 소비를 한 줄로 남겨보세요."}
                    </div>
                </div>
            </div>
        </div>
    );
}
