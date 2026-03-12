import { useEffect, useMemo, useState } from 'react';
import { requireStorePublicId } from '@/utils/store';
import {
    getSalesLedgerOrderDetail,
    getSalesLedgerOrders,
    getSalesLedgerTotalSummary,
} from '@/api';
import type {
    SalesLedgerOrderDetailResponse,
    SalesLedgerOrderStatus,
    SalesLedgerOrderSummaryResponse,
    SalesLedgerOrderType,
    SalesLedgerTotalSummaryResponse,
} from '@/types/sales/salesLedger.ts';

const KST_OFFSET = '+09:00';

function formatAmount(amount: number): string {
    return amount.toLocaleString('ko-KR');
}

function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function toKstDateTime(date: Date, endOfDay = false): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const time = endOfDay ? '23:59:59.999' : '00:00:00.000';
    return `${yyyy}-${mm}-${dd}T${time}${KST_OFFSET}`;
}

function getMonthDates(baseDate: Date): Date[] {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const lastDate = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: lastDate }, (_, idx) => new Date(year, month, idx + 1));
}

function groupByWeek(dates: Date[]): Date[][] {
    // 실제 달력 주차(일요일 시작) 기준으로 월 내 날짜를 그룹핑
    // 예: 2026-04은 1주차가 1~4일, 2주차가 5~11일
    if (dates.length === 0) return [];

    const firstDayOfMonth = dates[0].getDay(); // 0: 일요일
    const groups: Date[][] = [];

    dates.forEach((date) => {
        const weekIndex = Math.floor((date.getDate() + firstDayOfMonth - 1) / 7);
        if (!groups[weekIndex]) {
            groups[weekIndex] = [];
        }
        groups[weekIndex].push(date);
    });

    return groups;
}

function StatusBadge({ status }: { status: SalesLedgerOrderStatus }) {
    const color =
        status === 'REFUNDED'
            ? 'bg-rose-100 text-rose-700 border-rose-200'
            : 'bg-blue-100 text-blue-700 border-blue-200';
    const label = status === 'REFUNDED' ? '환불' : '완료';

    return (
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>
            {label}
        </span>
    );
}

export default function SalesLedgerPage() {
    const storePublicId = requireStorePublicId();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [monthCursor, setMonthCursor] = useState<Date>(new Date());
    const [status, setStatus] = useState<SalesLedgerOrderStatus | ''>('');
    const [type, setType] = useState<SalesLedgerOrderType | ''>('');
    const [page, setPage] = useState(0);

    const [orders, setOrders] = useState<SalesLedgerOrderSummaryResponse[]>([]);
    const [summary, setSummary] = useState<SalesLedgerTotalSummaryResponse | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedOrderDetail, setSelectedOrderDetail] = useState<SalesLedgerOrderDetailResponse | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const monthDates = useMemo(() => getMonthDates(monthCursor), [monthCursor]);
    const weekGroups = useMemo(() => groupByWeek(monthDates), [monthDates]);

    const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const displaySummary = useMemo(() => {
        if (!summary) {
            return { count: 0, totalAmount: 0, refundAmount: 0, netAmount: 0 };
        }
        return {
            count: summary.totalOrderCount,
            totalAmount: summary.totalAmount,
            refundAmount: summary.totalRefundAmount,
            netAmount: summary.totalNetAmount,
        };
    }, [summary]);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            setError(null);
            setSelectedOrderDetail(null);
            try {
                const queryParams = {
                    from: toKstDateTime(selectedDate),
                    to: toKstDateTime(selectedDate, true),
                    status: status || undefined,
                    type: type || undefined,
                    page,
                    size: 20,
                };

                const [orderData, summaryData] = await Promise.all([
                    getSalesLedgerOrders(storePublicId, queryParams),
                    getSalesLedgerTotalSummary(storePublicId, queryParams),
                ]);

                setOrders(orderData.content);
                setTotalPages(orderData.totalPages);
                setSummary(summaryData);
            } catch (err) {
                console.error('매출 원장 조회 실패:', err);
                setError('매출 원장을 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [storePublicId, selectedDate, status, type, page]);

    const handleOpenDetail = async (orderPublicId: string) => {
        setIsDetailLoading(true);
        try {
            const detail = await getSalesLedgerOrderDetail(storePublicId, orderPublicId);
            setSelectedOrderDetail(detail);
        } catch (err) {
            console.error('매출 상세 조회 실패:', err);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const moveMonth = (delta: number) => {
        const next = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + delta, 1);
        setMonthCursor(next);
    };

    const monthLabel = `${monthCursor.getFullYear()}.${String(monthCursor.getMonth() + 1).padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[280px_1fr]">
                <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <button onClick={() => moveMonth(-1)} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">&lt;</button>
                        <h2 className="text-lg font-bold text-slate-900">{monthLabel}</h2>
                        <button onClick={() => moveMonth(1)} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">&gt;</button>
                    </div>

                    <div className="space-y-4">
                        {weekGroups.map((week, idx) => (
                            <div key={`week-${idx}`}>
                                <p className="mb-2 text-xs font-bold text-slate-400">{idx + 1}주차</p>
                                <div className="space-y-1">
                                    {week.map((date) => {
                                        const active = sameDay(date, selectedDate);
                                        return (
                                            <button
                                                key={date.toISOString()}
                                                onClick={() => {
                                                    setSelectedDate(date);
                                                    setPage(0);
                                                }}
                                                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${active
                                                    ? 'bg-indigo-50 text-indigo-700'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {date.getDate()}일
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <section className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">매출 원장</h1>
                        <p className="mt-3 text-sm text-gray-500">
                            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 주문 매출 내역입니다.
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">주문 수</p><p className="mt-1 text-lg font-bold">{displaySummary.count}건</p></div>
                            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">총 매출</p><p className="mt-1 text-lg font-bold">{formatAmount(displaySummary.totalAmount)}원</p></div>
                            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">환불 금액</p><p className="mt-1 text-lg font-bold text-rose-600">{formatAmount(displaySummary.refundAmount)}원</p></div>
                            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">순매출</p><p className="mt-1 text-lg font-bold text-indigo-600">{formatAmount(displaySummary.netAmount)}원</p></div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value as SalesLedgerOrderStatus | '');
                                    setPage(0);
                                }}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            >
                                <option value="">전체 상태</option>
                                <option value="COMPLETED">완료</option>
                                <option value="REFUNDED">환불</option>
                            </select>
                            <select
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value as SalesLedgerOrderType | '');
                                    setPage(0);
                                }}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            >
                                <option value="">전체 유형</option>
                                <option value="DINE_IN">매장 식사</option>
                                <option value="TAKEOUT">포장</option>
                            </select>
                        </div>

                        {error && <p className="mb-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                                        <th className="px-3 py-3">주문번호</th>
                                        <th className="px-3 py-3">상태</th>
                                        <th className="px-3 py-3">유형</th>
                                        <th className="px-3 py-3">주문시각</th>
                                        <th className="px-3 py-3 text-right">순매출</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td className="px-3 py-8 text-center text-sm text-slate-400" colSpan={5}>불러오는 중...</td></tr>
                                    ) : orders.length === 0 ? (
                                        <tr><td className="px-3 py-8 text-center text-sm text-slate-400" colSpan={5}>조회 결과가 없습니다.</td></tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr
                                                key={order.orderPublicId}
                                                className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                                                onClick={() => handleOpenDetail(order.orderPublicId)}
                                            >
                                                <td className="px-3 py-3 text-sm font-semibold">#{order.orderPublicId.slice(0, 8)}</td>
                                                <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
                                                <td className="px-3 py-3 text-sm">{order.type === 'DINE_IN' ? '매장 식사' : '포장'}</td>
                                                <td className="px-3 py-3 text-sm">{formatDateTime(order.orderedAt)}</td>
                                                <td className="px-3 py-3 text-right text-sm font-bold">{formatAmount(order.netAmount)}원</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                                disabled={page === 0}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
                            >이전</button>
                            <span className="text-sm text-slate-500">{page + 1} / {Math.max(totalPages, 1)}</span>
                            <button
                                onClick={() => setPage((prev) => Math.min(prev + 1, Math.max(totalPages - 1, 0)))}
                                disabled={page >= totalPages - 1 || totalPages === 0}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
                            >다음</button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900">주문 상세</h3>
                        {isDetailLoading ? (
                            <p className="mt-3 text-sm text-slate-500">상세 불러오는 중...</p>
                        ) : selectedOrderDetail ? (
                            <div className="mt-3 space-y-3">
                                <div className="text-sm text-slate-600">테이블: {selectedOrderDetail.tableCode} · 품목 {selectedOrderDetail.itemCount}개</div>
                                <ul className="space-y-2">
                                    {selectedOrderDetail.items.map((item) => (
                                        <li key={`${item.menuName}-${item.price}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                                            <span>{item.menuName} x {item.quantity}</span>
                                            <span className="font-semibold">{formatAmount(item.subtotal)}원</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-slate-500">목록에서 주문을 선택하면 상세가 표시됩니다.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}