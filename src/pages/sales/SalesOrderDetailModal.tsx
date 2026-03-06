/**
 * 주문 상세 모달
 */

import { useEffect, useState } from 'react';
import { getSalesOrderDetail, refundSalesOrder } from '@/api';
import type { SalesOrderResponse, SalesOrderStatus } from '@/types/sales';

interface SalesOrderDetailModalProps {
    storePublicId: string;
    orderPublicId: string;
    onClose: () => void;
    onRefunded: () => void;
}

/**
 * 주문 상태 뱃지
 */
function StatusBadge({ status }: { status: SalesOrderStatus }) {
    const styles = {
        COMPLETED: 'bg-blue-100 text-blue-700 border border-blue-200',
        REFUNDED: 'bg-rose-100 text-rose-700 border border-rose-200',
    };

    const labels = {
        COMPLETED: '완료',
        REFUNDED: '환불',
    };

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
        >
            {labels[status]}
        </span>
    );
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD HH:mm)
 */
function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * 금액 포맷팅
 */
function formatAmount(amount: number): string {
    return amount.toLocaleString('ko-KR');
}

export default function SalesOrderDetailModal({
    storePublicId,
    orderPublicId,
    onClose,
    onRefunded,
}: SalesOrderDetailModalProps) {
    const [order, setOrder] = useState<SalesOrderResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefunding, setIsRefunding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 주문 상세 조회
    const fetchOrderDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getSalesOrderDetail(storePublicId, orderPublicId);
            setOrder(data);
        } catch (err) {
            console.error('주문 상세 조회 실패:', err);
            setError('주문 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetail();
    }, []);

    // 환불 처리
    const handleRefund = async () => {
        if (!order) return;

        if (
            !confirm(
                `주문번호 ${order.orderPublicId.substring(0, 8)}...을(를) 환불하시겠습니까?\n재고는 복구되지 않습니다.`
            )
        ) {
            return;
        }

        setIsRefunding(true);
        try {
            await refundSalesOrder(storePublicId, orderPublicId);
            alert('환불이 완료되었습니다.');
            onRefunded();
        } catch (err) {
            console.error('환불 처리 실패:', err);
            alert('환불 처리에 실패했습니다.');
        } finally {
            setIsRefunding(false);
        }
    };

    // 모달 배경 클릭 시 닫기
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-900">주문 상세</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* 내용 */}
                <div className="p-6 space-y-6">
                    {isLoading ? (
                        <div className="py-10 text-center text-gray-400">
                            주문 정보를 불러오는 중...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                            <p className="text-sm font-semibold text-rose-700">{error}</p>
                        </div>
                    ) : order ? (
                        <>
                            {/* 주문 기본 정보 */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        주문 정보
                                    </h3>
                                    <StatusBadge status={order.status} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-semibold text-slate-500 uppercase">
                                            주문번호
                                        </div>
                                        <div className="mt-1 text-sm font-medium text-slate-900">
                                            {order.orderPublicId}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-slate-500 uppercase">
                                            테이블
                                        </div>
                                        <div className="mt-1 text-sm font-bold text-slate-900">
                                            {order.tableCode}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-slate-500 uppercase">
                                            주문일시
                                        </div>
                                        <div className="mt-1 text-sm font-medium text-slate-900">
                                            {formatDateTime(order.orderedAt)}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-slate-500 uppercase">
                                            완료일시
                                        </div>
                                        <div className="mt-1 text-sm font-medium text-slate-900">
                                            {formatDateTime(order.completedAt)}
                                        </div>
                                    </div>

                                    {order.refundedAt && (
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500 uppercase">
                                                환불일시
                                            </div>
                                            <div className="mt-1 text-sm font-medium text-rose-700">
                                                {formatDateTime(order.refundedAt)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 주문 항목 */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-900">주문 내역</h3>

                                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 text-sm font-bold text-slate-500 uppercase">
                                                    메뉴
                                                </th>
                                                <th className="px-6 py-3 text-sm font-bold text-slate-500 uppercase text-right">
                                                    단가
                                                </th>
                                                <th className="px-6 py-3 text-sm font-bold text-slate-500 uppercase text-center">
                                                    수량
                                                </th>
                                                <th className="px-6 py-3 text-sm font-bold text-slate-500 uppercase text-right">
                                                    합계
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {order.items.map((item, index) => (
                                                <tr key={index} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold text-slate-900">
                                                            {item.menuName}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-sm text-slate-600">
                                                            {formatAmount(item.price)}원
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-sm font-medium text-slate-900">
                                                            {item.quantity}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-sm font-bold text-slate-900">
                                                            {formatAmount(item.subtotal)}원
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* 총액 */}
                                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-bold text-indigo-900">
                                            총 결제 금액
                                        </div>
                                        <div className="text-2xl font-black text-indigo-600">
                                            {formatAmount(order.totalAmount)}원
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 환불 버튼 (COMPLETED 상태일 때만) */}
                            {order.status === 'COMPLETED' && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleRefund}
                                        disabled={isRefunding}
                                        className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isRefunding ? '환불 처리 중...' : '환불 처리'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}