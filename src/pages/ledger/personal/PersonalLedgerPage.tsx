import {useMemo, useState} from "react";
import {
    Calendar,
    CalendarDetail,
    type DayData,
    cn,
    formatNum,
    sumExpense,
    toISODate,
} from "../../../components/calendar";
import ReceiptScanModal from "../../../components/receipt/ReceiptScanModal";
import TransactionRecordModal from "../../../components/form/TransactionRecordModal";
import type {TransactionFormData} from "../../../components/form/TransactionForm";

const NEUTRAL_ACTION = "#0F172A";
const NEUTRAL_TEXT = "#0F172A";
const NEUTRAL_BAR = "#0F172A";

const GOAL_PROGRESS_GRADIENT = `linear-gradient(90deg, rgba(105,175,255,0.95) 0%, rgba(105,175,255,0.65) 55%, rgba(105,175,255,0.35) 100%)`;

export default function PersonalLedgerPage() {
    const [year, setYear] = useState(2023);
    const [month0, setMonth0] = useState(9); // 0-index, 9=10월
    const [isReceiptScanModalOpen, setReceiptScanModalOpen] = useState(false);
    const [isRecordModalOpen, setRecordModalOpen] = useState(false);

    // 샘플 데이터
    const sampleData: DayData[] = useMemo(
        () => [
            {
                date: "2023-10-05",
                txs: [
                    {
                        id: "t1",
                        title: "스타벅스 강남점",
                        category: "카페/간식",
                        time: "오후 02:30",
                        amount: -5600,
                        method: "신한카드(04**)",
                    },
                    {
                        id: "t2",
                        title: "이마트 역삼점",
                        category: "식비",
                        time: "오후 06:15",
                        amount: -18400,
                        method: "현대카드(12**)",
                    },
                ],
                memo: "오늘은 잠을 많이 봐서 예산이 조금 빠듯함. 내일은 무지출 챌린지 시도!",
            },
            {
                date: "2023-10-08",
                txs: [{id: "t3", title: "급여", category: "수입", time: "오전 09:00", amount: 3117000}],
            },
            {date: "2023-10-09", txs: [{id: "t4", title: "편의점", category: "식비", time: "오후 08:10", amount: -4200}]},
            {date: "2023-10-10", txs: [{id: "t5", title: "버스", category: "교통", time: "오전 08:20", amount: -1500}]},
            {date: "2023-10-13", txs: [{id: "t6", title: "점심", category: "식비", time: "오후 12:30", amount: -7200}]},
            {date: "2023-10-14", txs: [{id: "t7", title: "중고거래", category: "기타수입", time: "오후 03:00", amount: 73500}]},
            {date: "2023-10-19", txs: [{id: "t8", title: "구독", category: "고정비", time: "오전 10:00", amount: -14400}]},
            {
                date: "2023-10-23",
                txs: [
                    {id: "t9", title: "보너스", category: "수입", time: "오후 01:00", amount: 3000000},
                    {id: "t10", title: "장보기", category: "식비", time: "오후 06:40", amount: -181411},
                ],
            },
            {date: "2023-10-27", txs: [{id: "t11", title: "택시", category: "교통", time: "오후 11:20", amount: -32400}]},
            {date: "2023-10-28", txs: [{id: "t12", title: "환급", category: "기타수입", time: "오전 10:10", amount: 294000}]},
            {date: "2023-10-30", txs: [{id: "t13", title: "식비", category: "식비", time: "오후 07:30", amount: -36000}]},
            {date: "2023-10-31", txs: [{id: "t14", title: "카페", category: "카페/간식", time: "오후 02:10", amount: -28800}]},
        ],
        []
    );

    const dataMap = useMemo(() => {
        const m = new Map<string, DayData>();
        for (const d of sampleData) m.set(d.date, d);
        return m;
    }, [sampleData]);

    const daysInMonth = useMemo(() => new Date(year, month0 + 1, 0).getDate(), [year, month0]);

    const defaultSelected = useMemo(() => toISODate(year, month0, Math.min(5, daysInMonth)), [year, month0, daysInMonth]);

    const [selectedDate, setSelectedDate] = useState<string>(defaultSelected);

    useMemo(() => {
        setSelectedDate(defaultSelected);
    }, [defaultSelected]);

    const selectedData = dataMap.get(selectedDate);

    // 통계용
    const monthKey = useMemo(() => `${year}-${String(month0 + 1).padStart(2, "0")}`, [year, month0]);
    const monthLabel = useMemo(() => `${year}년 ${month0 + 1}월`, [year, month0]);

    const monthTxs = useMemo(() => {
        const all: DayData["txs"] = [];
        for (const [date, day] of dataMap.entries()) {
            if (date.startsWith(monthKey)) all.push(...day.txs);
        }
        return all;
    }, [dataMap, monthKey]);

    const monthlyReportAvailable = useMemo(() => monthTxs.length > 0, [monthTxs.length]);

    const topExpenseCategory = useMemo(() => {
        const map = new Map<string, number>();
        for (const t of monthTxs) {
            if (t.amount >= 0) continue;
            map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount));
        }
        let best = {category: "없음", amount: 0};
        for (const [k, v] of map.entries()) {
            if (v > best.amount) best = {category: k, amount: v};
        }
        return best;
    }, [monthTxs]);

    const expenseDaysCount = useMemo(() => {
        let c = 0;
        const firstDay = new Date(year, month0, 1);
        const startWeekday = firstDay.getDay();
        const total = startWeekday + daysInMonth;
        const rows = Math.ceil(total / 7);
        const cellCount = rows * 7;

        for (let i = 0; i < cellCount; i += 1) {
            const dayNum = i - startWeekday + 1;
            if (dayNum >= 1 && dayNum <= daysInMonth) {
                const iso = toISODate(year, month0, dayNum);
                const txs = dataMap.get(iso)?.txs ?? [];
                if (sumExpense(txs) > 0) c += 1;
            }
        }
        return c;
    }, [year, month0, daysInMonth, dataMap]);

    const goals = useMemo(
        () => [
            {id: "g1", title: "무지출 데이 6회 달성", meta: "이번 달 목표", progress: 4, total: 6},
            {id: "g2", title: "저축 300,000원", meta: "자산 목표", progress: 180000, total: 300000, isMoney: true as const},
        ],
        []
    );

    // Handlers
    const gotoPrevMonth = () => {
        const d = new Date(year, month0, 1);
        d.setMonth(d.getMonth() - 1);
        setYear(d.getFullYear());
        setMonth0(d.getMonth());
    };

    const gotoNextMonth = () => {
        const d = new Date(year, month0, 1);
        d.setMonth(d.getMonth() + 1);
        setYear(d.getFullYear());
        setMonth0(d.getMonth());
    };

    const gotoToday = () => {
        const now = new Date();
        setYear(now.getFullYear());
        setMonth0(now.getMonth());
        setSelectedDate(toISODate(now.getFullYear(), now.getMonth(), now.getDate()));
    };

    const handleRecordClick = () => {
        setRecordModalOpen(true);
    };

    const handleReceiptScanClick = () => {
        setReceiptScanModalOpen(true);
    };

    const handleMonthlyReportClick = () => {
        window.alert("월간 리포트: 연결 예정");
    };

    const handleTransactionSubmit = (data: TransactionFormData) => {
        // TODO: 실제 데이터 저장 로직 구현
        console.log("New transaction:", data);
        window.alert(JSON.stringify(data, null, 2));
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: 사이드바 */}
                <aside className="lg:col-span-3 space-y-4">
                    {/* 이번 달 예산 카드 */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-extrabold text-slate-900">이번 달 예산</div>

                            <button type="button" className="text-xs font-semibold hover:opacity-80"
                                    style={{color: NEUTRAL_ACTION}}>
                                관리
                            </button>
                        </div>

                        <div className="mt-3 text-xs text-slate-500">사용률 65%</div>

                        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full w-[65%] rounded-full"
                                style={{
                                    backgroundColor: NEUTRAL_BAR,
                                    opacity: 0.55,
                                }}
                            />
                        </div>

                        <div className="mt-3 flex items-end justify-between">
                            <div className="text-xs text-slate-500">남은 예산</div>
                            <div
                                className="text-sm font-extrabold text-slate-900 [font-variant-numeric:tabular-nums]">700,000
                            </div>
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                            총 예산{" "}
                            <span
                                className="font-semibold text-slate-600 [font-variant-numeric:tabular-nums]">1,300,000</span>
                        </div>
                    </div>

                    {/* 목표 */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-extrabold text-slate-900">목표</div>
                            <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                                관리
                            </button>
                        </div>

                        <div className="mt-3 space-y-3">
                            {goals.map((g) => {
                                const ratio = g.total === 0 ? 0 : Math.min(100, Math.round((g.progress / g.total) * 100));
                                const progressText = g.isMoney ? `${formatNum(g.progress)} / ${formatNum(g.total)}원` : `${g.progress} / ${g.total}`;

                                return (
                                    <div key={g.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="text-sm font-extrabold text-slate-900">{g.title}</div>
                                                <div className="mt-0.5 text-xs text-slate-500">{g.meta}</div>
                                            </div>

                                            <div className="text-xs font-extrabold [font-variant-numeric:tabular-nums]"
                                                 style={{color: NEUTRAL_TEXT}}>
                                                {progressText}
                                            </div>
                                        </div>

                                        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-[width] duration-500 ease-out"
                                                style={{width: `${ratio}%`, backgroundImage: GOAL_PROGRESS_GRADIENT}}
                                            />
                                        </div>

                                        <div className="mt-1 text-[11px] text-slate-400">달성률 {ratio}%</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* AI 요약(인사이트) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-extrabold text-slate-900">AI 요약</div>
                            <span className="text-xs font-semibold text-slate-400">Beta</span>
                        </div>

                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                            <div className="rounded-xl bg-slate-50/70 border border-slate-200 p-3">
                                <div className="text-xs text-slate-500">이번 달 지출 Top</div>
                                <div className="mt-1 font-bold text-slate-900">
                                    {topExpenseCategory.category}{" "}
                                    <span
                                        className="text-rose-600 [font-variant-numeric:tabular-nums]">-{formatNum(topExpenseCategory.amount)}</span>
                                </div>
                            </div>

                            <div className="rounded-xl bg-slate-50/70 border border-slate-200 p-3">
                                <div className="text-xs text-slate-500">지출 발생일</div>
                                <div
                                    className="mt-1 font-bold text-slate-900 [font-variant-numeric:tabular-nums]">{expenseDaysCount}일
                                </div>
                            </div>

                            <div className="rounded-xl bg-slate-50/70 border border-slate-200 p-3">
                                <div className="text-xs text-slate-500">추천</div>
                                <div className="mt-1 text-slate-700">
                                    이번 달은 <span className="font-semibold">고정비</span>를 먼저 점검하고, 지출이 큰 카테고리를 1개만 줄여보세요.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 월간 리포트 */}
                    <button
                        type="button"
                        onClick={handleMonthlyReportClick}
                        disabled={!monthlyReportAvailable}
                        className={cn(
                            "w-full text-left rounded-2xl p-4 border shadow-sm transition-colors",
                            monthlyReportAvailable ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-slate-100 border-slate-200 cursor-not-allowed"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div
                                    className={cn("text-sm font-extrabold", monthlyReportAvailable ? "text-slate-900" : "text-slate-400")}>
                                    월간 리포트
                                </div>
                                <div
                                    className="mt-1 text-xs text-slate-500">{monthlyReportAvailable ? `${monthLabel} 자세히 보기` : "아직 데이터가 없어요"}</div>
                        </div>

                        {monthlyReportAvailable && (
                            <div
                                className="h-9 w-9 rounded-xl border border-slate-200 bg-white grid place-items-center text-slate-700">
                                <span className="text-lg">›</span>
                            </div>
                        )}
                    </div>
                </button>
            </aside>

            {/* Center: 캘린더 */}
            <section className="lg:col-span-6">
                <Calendar
                    year={year}
                    month0={month0}
                    dataMap={dataMap}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    onPrevMonth={gotoPrevMonth}
                    onNextMonth={gotoNextMonth}
                    onToday={gotoToday}
                    onRecordClick={handleRecordClick}
                    onReceiptScanClick={handleReceiptScanClick}
                />
            </section>

            {/* Right: 상세 내역 */}
            <aside className="lg:col-span-3">
                <CalendarDetail selectedDate={selectedDate} selectedData={selectedData}/>
            </aside>
        </div>
        
        {isReceiptScanModalOpen && (
            <ReceiptScanModal onClose={() => setReceiptScanModalOpen(false)} />
        )}

        {isRecordModalOpen && (
            <TransactionRecordModal
                onClose={() => setRecordModalOpen(false)}
                onSubmit={handleTransactionSubmit}
                initialDate={selectedDate}
            />
        )}
    </>
    );
}
