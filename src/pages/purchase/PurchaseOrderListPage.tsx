import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getPurchaseOrders,
    getPurchaseOrder,
    cancelPurchaseOrder,
    downloadPurchaseOrderPdf
} from '@/api/purchase';
import { requireStorePublicId } from '@/utils/store';
import type {
    PurchaseOrderSummary,
    PurchaseOrderDetail,
    PurchaseOrderStatus
} from '@/types/purchase/purchase.ts';
import { Plus, FileText, FileDown, XCircle, Edit, X } from 'lucide-react';

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
    const styles = {
        ORDERED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        CANCELED: 'bg-slate-100 text-slate-500 border border-slate-200'
    };

    const labels = {
        ORDERED: '발주 완료',
        CANCELED: '발주 취소'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
    );
}

export default function PurchaseOrderListPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<PurchaseOrderSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDetail | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const storePublicId = requireStorePublicId();
            const response = await getPurchaseOrders(storePublicId);
            setOrders(response.data);
        } catch (error) {
            console.error('발주서 목록 조회 실패:', error);
            alert('발주서 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetail = async (purchaseOrderPublicId: string) => {
        try {
            setIsLoadingDetail(true);
            setIsModalOpen(true);
            const storePublicId = requireStorePublicId();
            const response = await getPurchaseOrder(storePublicId, purchaseOrderPublicId);
            setSelectedOrder(response.data);
        } catch (error) {
            console.error('발주서 조회 실패:', error);
            alert('발주서를 불러오는데 실패했습니다.');
            setIsModalOpen(false);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const handleCancel = async () => {
        if (!selectedOrder) return;

        if (!confirm('발주서를 취소하시겠습니까?')) return;

        try {
            setIsCanceling(true);
            const storePublicId = requireStorePublicId();
            const updatedOrder = await cancelPurchaseOrder(
                storePublicId,
                selectedOrder.purchaseOrderPublicId
            );
            setSelectedOrder(updatedOrder.data);
            // 목록도 새로고침
            await fetchOrders();
            alert('발주서가 취소되었습니다.');
        } catch (error) {
            console.error('발주서 취소 실패:', error);
            alert('발주서 취소에 실패했습니다.');
        } finally {
            setIsCanceling(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!selectedOrder) return;

        try {
            setIsDownloading(true);
            const storePublicId = requireStorePublicId();
            const blob = await downloadPurchaseOrderPdf(
                storePublicId,
                selectedOrder.purchaseOrderPublicId
            );

            // Blob을 다운로드
            const url = window.URL.createObjectURL(blob.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `purchase-order-${selectedOrder.purchaseOrderPublicId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF 다운로드 실패:', error);
            alert('PDF 다운로드에 실패했습니다.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleEdit = () => {
        if (!selectedOrder) return;
        navigate(`/purchase-orders/${selectedOrder.purchaseOrderPublicId}/edit`);
    };

    const handleCreate = () => {
        navigate('/purchase-orders/new');
    };

    const formatCurrency = (amount: number): string => {
        return `₩${amount.toLocaleString('ko-KR')}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-[72px]">
            {/* 중앙 모달 (발주서 상세) */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={handleCloseModal}
                >
                    <div
                        className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                {/* 모달 헤더 */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900">발주서 상세</h2>
                            {selectedOrder && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {selectedOrder.orderNo || 'N/A'}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleCloseModal}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* 모달 바디 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoadingDetail ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
                                <p className="mt-4 text-sm text-slate-500">로딩 중...</p>
                            </div>
                        </div>
                    ) : selectedOrder ? (
                        <>
                            {/* 기본 정보 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    기본 정보
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs font-semibold text-slate-500">주문번호</span>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {selectedOrder.orderNo || 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-xs font-semibold text-slate-500">거래처</span>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {selectedOrder.vendorName || '거래처 없음'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-xs font-semibold text-slate-500">상태</span>
                                        <div className="mt-1">
                                            <StatusBadge status={selectedOrder.status} />
                                        </div>
                                    </div>

                                    {selectedOrder.canceledAt && (
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500">취소 일시</span>
                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                {new Date(selectedOrder.canceledAt).toLocaleString('ko-KR')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 발주 항목 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    발주 항목
                                </h3>

                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-3 py-2 text-xs font-bold text-slate-500 uppercase">
                                                품목
                                            </th>
                                            <th className="px-3 py-2 text-xs font-bold text-slate-500 uppercase text-center">
                                                수량
                                            </th>
                                            <th className="px-3 py-2 text-xs font-bold text-slate-500 uppercase text-right">
                                                단가
                                            </th>
                                            <th className="px-3 py-2 text-xs font-bold text-slate-500 uppercase text-right">
                                                금액
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                        {selectedOrder.items.map((item, index) => (
                                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2 text-sm font-medium text-slate-900">
                                                    {item.itemName}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-center text-slate-700">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-right text-slate-700">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-right font-semibold text-slate-900">
                                                    {formatCurrency(item.lineAmount)}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 총액 */}
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-bold text-slate-900">총 금액</span>
                                    <span className="text-2xl font-extrabold text-amber-700">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </span>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* 모달 푸터 (버튼) */}
                {selectedOrder && (
                    <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-2">
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileDown className="h-4 w-4" />
                            {isDownloading ? '다운로드 중...' : 'PDF 다운로드'}
                        </button>

                        {selectedOrder.status === 'ORDERED' && (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={handleEdit}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 transition-all active:scale-95 shadow-md"
                                >
                                    <Edit className="h-4 w-4" />
                                    수정
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isCanceling}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <XCircle className="h-4 w-4" />
                                    {isCanceling ? '취소 중...' : '발주 취소'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                    </div>
                </div>
            )}

            {/* 메인 컨텐츠 */}
            <div className="mx-auto max-w-7xl px-6 py-8">
                {/* 헤더 */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">발주 관리</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            발주서를 생성하고 관리합니다
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreate}
                        className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-700 transition-all active:scale-95 shadow-md"
                    >
                        <Plus className="h-5 w-5" />
                        발주서 생성
                    </button>
                </div>

                {/* 테이블 */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        {/* 헤더 */}
                        <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">
                                주문번호
                            </th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">
                                거래처
                            </th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">
                                상태
                            </th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase text-right">
                                총액
                            </th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase text-right">
                                관리
                            </th>
                        </tr>
                        </thead>

                        {/* 바디 */}
                        <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                                        <p className="text-sm">데이터 로딩 중...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : orders.length > 0 ? (
                            orders.map((order) => (
                                <tr
                                    key={order.purchaseOrderPublicId}
                                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                    onClick={() => handleViewDetail(order.purchaseOrderPublicId)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-amber-600" />
                                            <span className="font-medium text-slate-900">
                          {order.orderNo || 'N/A'}
                        </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                      <span className="text-slate-700">
                        {order.vendorName || '거래처 없음'}
                      </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <StatusBadge status={order.status} />
                                    </td>

                                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetail(order.purchaseOrderPublicId);
                                            }}
                                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            상세보기
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="rounded-full bg-slate-100 p-3">
                                            <FileText className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                발주서가 없습니다
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                새 발주서를 생성해보세요
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCreate}
                                            className="mt-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                                        >
                                            발주서 생성
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}