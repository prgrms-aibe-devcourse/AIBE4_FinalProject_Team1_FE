/**
 * 주문 목록 페이지
 */

import { useEffect, useState } from 'react';
import { getSalesOrders } from '@/api/sales';
import { requireStorePublicId } from '@/utils/store';
import type { SalesOrderResponse, SalesOrderStatus } from '@/types/sales/sales.ts';
import SalesOrderDetailModal from './SalesOrderDetailModal';

type VIEW = 'LIST' | 'DETAIL';

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

export default function SalesOrderListPage() {
    const [view, setView] = useState<VIEW>('LIST');
    const [orders, setOrders] = useState<SalesOrderResponse[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<SalesOrderResponse | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const storePublicId = requireStorePublicId();

    // 주문 목록 조회
    const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getSalesOrders(storePublicId);
            setOrders(data);
        } catch (err) {
            console.error('주문 목록 조회 실패:', err);
            setError('주문 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // 주문 상세 보기
    const handleViewDetail = (order: SalesOrderResponse) => {
        setSelectedOrder(order);
        setView('DETAIL');
    };

    // 상세 모달 닫기
    const handleCloseDetail = () => {
        setView('LIST');
        setSelectedOrder(null);
    };

    // 환불 후 목록 새로고침
    const handleRefunded = () => {
        fetchOrders();
        handleCloseDetail();
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-[72px]">
            <div className="mx-auto max-w-7xl px-6 py-8">
                {/* 헤더 */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">주문 현황</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        매장의 모든 주문 내역을 확인할 수 있습니다.
                    </p>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <p className="text-sm font-semibold text-rose-700">{error}</p>
                    </div>
                )}

                {/* 주문 목록 테이블 */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        {/* 헤더 */}
                        <thead className="bg-slate-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">
                                주문번호
                            </th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">
                                테이블
                            </th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">
                                주문일시
                            </th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase text-right">
                                금액
                            </th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase text-center">
                                상태
                            </th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase text-right">
                                관리
                            </th>
                        </tr>
                        </thead>

                        {/* 바디 */}
                        <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-10 text-center text-gray-400"
                                >
                                    주문 목록을 불러오는 중...
                                </td>
                            </tr>
                        ) : orders.length > 0 ? (
                            orders.map((order) => (
                                <tr
                                    key={order.orderPublicId}
                                    className="hover:bg-slate-50 transition-colors group"
                                >
                                    {/* 주문번호 */}
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        <div className="text-sm">
                                            {order.orderPublicId.substring(0, 8)}...
                                        </div>
                                    </td>

                                    {/* 테이블 */}
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-slate-700">
                                            {order.tableCode}
                                        </div>
                                    </td>

                                    {/* 주문일시 */}
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600">
                                            {formatDateTime(order.orderedAt)}
                                        </div>
                                    </td>

                                    {/* 금액 */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm font-bold text-indigo-600">
                                            {formatAmount(order.totalAmount)}원
                                        </div>
                                    </td>

                                    {/* 상태 */}
                                    <td className="px-6 py-4 text-center">
                                        <StatusBadge status={order.status} />
                                    </td>

                                    {/* 관리 버튼 */}
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleViewDetail(order)}
                                            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                                        >
                                            상세
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-10 text-center text-gray-400"
                                >
                                    주문 내역이 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 주문 상세 모달 */}
            {view === 'DETAIL' && selectedOrder && (
                <SalesOrderDetailModal
                    storePublicId={storePublicId}
                    orderPublicId={selectedOrder.orderPublicId}
                    onClose={handleCloseDetail}
                    onRefunded={handleRefunded}
                />
            )}
        </div>
    );
}