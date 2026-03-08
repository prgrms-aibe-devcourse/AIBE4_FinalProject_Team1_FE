import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getPurchaseOrders,
    getPurchaseOrder,
    cancelPurchaseOrder,
    downloadPurchaseOrderPdf,
    updatePurchaseOrder
} from '@/api/purchase/purchase.ts';
import { getVendors } from '@/api/reference/vendor.ts';
import { requireStorePublicId } from '@/utils/store';
import type {
    PurchaseOrderSummary,
    PurchaseOrderDetail,
    PurchaseOrderStatus,
    PurchaseOrderItemRequest
} from '@/types/purchase/purchase.ts';
import type { VendorResponse } from '@/types/reference/vendor.ts';
import {
    Plus,
    FileText,
    FileDown,
    XCircle,
    Edit,
    X,
    Trash2,
    Save,
    Search,
    ChevronLeft,
    ChevronRight,
    PackageSearch
} from 'lucide-react';
import type { PageResponse } from '@/types/common/common';

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
    const styles = {
        ORDERED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        CANCELED: 'bg-gray-100 text-gray-500 border border-gray-200'
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

type ViewMode = 'VIEW' | 'EDIT';

export default function PurchaseOrderListPage() {
    const navigate = useNavigate();
    const [pageData, setPageData] = useState<PageResponse<PurchaseOrderSummary> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
    const [page, setPage] = useState(0);

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDetail | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // 수정 모드 상태
    const [viewMode, setViewMode] = useState<ViewMode>('VIEW');
    const [vendors, setVendors] = useState<VendorResponse[]>([]);
    const [editVendorId, setEditVendorId] = useState<string>('');
    const [editItems, setEditItems] = useState<PurchaseOrderItemRequest[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const storePublicId = requireStorePublicId();
            const response = await getPurchaseOrders(storePublicId, {
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                keyword: searchTerm || undefined,
                page,
                size: 10
            });
            setPageData(response.data);
        } catch (error) {
            console.error('발주서 목록 조회 실패:', error);
            alert('발주서 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    // 검색어 입력 시 0페이지로 이동하며 로드 (디바운스)
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            fetchOrders();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const orders = pageData?.content || [];

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
        setViewMode('VIEW');
        setEditItems([]);
        setEditVendorId('');
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

    const handleEdit = async () => {
        if (!selectedOrder) return;

        try {
            // 거래처 목록 불러오기
            const storePublicId = requireStorePublicId();
            const vendorsResponse = await getVendors(storePublicId, { status: 'ACTIVE', size: 1000 });
            setVendors(vendorsResponse.data.content);

            // 수정용 데이터 초기화
            setEditVendorId(selectedOrder.vendorPublicId || '');
            setEditItems(selectedOrder.items.map(item => ({
                itemName: item.itemName,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice
            })));

            // 수정 모드로 전환
            setViewMode('EDIT');
        } catch (error) {
            console.error('거래처 목록 조회 실패:', error);
            alert('거래처 목록을 불러오는데 실패했습니다.');
        }
    };

    const handleCancelEdit = () => {
        setViewMode('VIEW');
        setEditItems([]);
        setEditVendorId('');
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        // Validation
        if (!editVendorId) {
            alert('거래처를 선택해주세요.');
            return;
        }

        if (editItems.some(item => !item.itemName.trim())) {
            alert('품목명을 입력해주세요.');
            return;
        }

        if (editItems.some(item => item.quantity < 1)) {
            alert('수량은 1 이상이어야 합니다.');
            return;
        }

        if (editItems.some(item => item.unitPrice <= 0)) {
            alert('단가는 0보다 커야 합니다.');
            return;
        }

        try {
            setIsSubmitting(true);
            const storePublicId = requireStorePublicId();
            const updatedOrder = await updatePurchaseOrder(
                storePublicId,
                selectedOrder.purchaseOrderPublicId,
                {
                    vendorPublicId: editVendorId,
                    items: editItems
                }
            );

            setSelectedOrder(updatedOrder.data);
            setViewMode('VIEW');
            await fetchOrders(); // 목록도 새로고침
            alert('발주서가 수정되었습니다.');
        } catch (error) {
            console.error('발주서 수정 실패:', error);
            alert('발주서 수정에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleItemChange = (
        index: number,
        field: keyof PurchaseOrderItemRequest,
        value: string | number
    ) => {
        const newItems = [...editItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditItems(newItems);
    };

    const handleAddItem = () => {
        setEditItems([...editItems, { itemName: '', quantity: 1, unit: 'EA', unitPrice: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        if (editItems.length === 1) {
            alert('최소 1개의 발주 항목이 필요합니다.');
            return;
        }
        setEditItems(editItems.filter((_, i) => i !== index));
    };

    const calculateEditTotal = (): number => {
        return editItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    };

    const handleCreate = () => {
        navigate('/purchase-orders/new');
    };

    const formatCurrency = (amount: number): string => {
        return `₩${amount.toLocaleString('ko-KR')}`;
    };

    return (
        <>
            {/* 중앙 모달 (발주서 상세) */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={handleCloseModal}
                >
                    <div
                        className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 모달 헤더 */}
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 text-gray-700 rounded-xl flex items-center justify-center">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-gray-900">발주서 상세</h2>
                                    {selectedOrder && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {selectedOrder.orderNo || 'N/A'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* 모달 바디 */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {isLoadingDetail ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-900 border-t-transparent mx-auto" />
                                        <p className="mt-4 text-sm text-gray-500">로딩 중...</p>
                                    </div>
                                </div>
                            ) : selectedOrder ? (
                                viewMode === 'VIEW' ? (
                                    <>
                                        {/* 기본 정보 */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                                기본 정보
                                            </h3>

                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-xs font-semibold text-gray-500">주문번호</span>
                                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                                        {selectedOrder.orderNo || 'N/A'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-xs font-semibold text-gray-500">거래처</span>
                                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                                        {selectedOrder.vendorName || '거래처 없음'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-xs font-semibold text-gray-500">상태</span>
                                                    <div className="mt-1">
                                                        <StatusBadge status={selectedOrder.status} />
                                                    </div>
                                                </div>

                                                {selectedOrder.canceledAt && (
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-500">취소 일시</span>
                                                        <p className="mt-1 text-sm font-medium text-gray-700">
                                                            {new Date(selectedOrder.canceledAt).toLocaleString('ko-KR')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 발주 항목 */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                                발주 항목
                                            </h3>

                                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-gray-50 border-b border-gray-100">
                                                        <tr>
                                                            <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">
                                                                품목
                                                            </th>
                                                            <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase text-center">
                                                                수량
                                                            </th>
                                                            <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase text-center">
                                                                단위
                                                            </th>
                                                            <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase text-right">
                                                                단가
                                                            </th>
                                                            <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase text-right">
                                                                금액
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {selectedOrder.items.map((item, index) => (
                                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                                                    {item.itemName}
                                                                </td>
                                                                <td className="px-3 py-2 text-sm text-center text-gray-700">
                                                                    {item.quantity}
                                                                </td>
                                                                <td className="px-3 py-2 text-sm text-center text-gray-700">
                                                                    {item.unit}
                                                                </td>
                                                                <td className="px-3 py-2 text-sm text-right text-gray-700">
                                                                    {formatCurrency(item.unitPrice)}
                                                                </td>
                                                                <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900">
                                                                    {formatCurrency(item.lineAmount)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* 총액 */}
                                        <div className="rounded-xl border border-gray-300 bg-gray-100 p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-base font-bold text-gray-900">총 금액</span>
                                                <span className="text-2xl font-extrabold text-gray-900">
                                                    {formatCurrency(selectedOrder.totalAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* EDIT 모드 */
                                    <form onSubmit={handleUpdateSubmit} className="space-y-6">
                                        {/* 주문번호 (읽기 전용) */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">주문번호</label>
                                            <p className="text-sm font-semibold text-gray-900">{selectedOrder.orderNo || 'N/A'}</p>
                                        </div>

                                        {/* 거래처 선택 */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">거래처 *</label>
                                            <select
                                                value={editVendorId}
                                                onChange={(e) => setEditVendorId(e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black focus:outline-none"
                                                required
                                            >
                                                <option value="">거래처 선택</option>
                                                {vendors.map((vendor) => (
                                                    <option key={vendor.vendorPublicId} value={vendor.vendorPublicId}>
                                                        {vendor.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 발주 항목 */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">발주 항목</h3>
                                                <button
                                                    type="button"
                                                    onClick={handleAddItem}
                                                    className="flex items-center gap-1 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-900 transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    항목 추가
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {editItems.map((item, index) => (
                                                    <div key={index} className="grid grid-cols-12 gap-2 items-start p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                                                        {/* 품목명 */}
                                                        <div className="col-span-3">
                                                            <input
                                                                type="text"
                                                                placeholder="예: 양파, 감자"
                                                                value={item.itemName}
                                                                onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black focus:outline-none"
                                                                required
                                                            />
                                                        </div>

                                                        {/* 수량 */}
                                                        <div className="col-span-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 text-center focus:ring-2 focus:ring-black focus:outline-none"
                                                                required
                                                            />
                                                        </div>

                                                        {/* 단위 */}
                                                        <div className="col-span-2">
                                                            {item.unit === '기타' ? (
                                                                <input
                                                                    type="text"
                                                                    placeholder="단위 입력"
                                                                    value={item.unit}
                                                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 text-center focus:ring-2 focus:ring-black focus:outline-none"
                                                                    required
                                                                />
                                                            ) : (
                                                                <select
                                                                    value={item.unit}
                                                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black focus:outline-none"
                                                                    required
                                                                >
                                                                    <option value="EA">EA</option>
                                                                    <option value="G">G</option>
                                                                    <option value="ML">ML</option>
                                                                    <option value="KG">KG</option>
                                                                    <option value="L">L</option>
                                                                    <option value="박스">박스</option>
                                                                    <option value="기타">기타</option>
                                                                </select>
                                                            )}
                                                        </div>

                                                        {/* 단가 */}
                                                        <div className="col-span-2">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="10000"
                                                                value={item.unitPrice || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                                        handleItemChange(index, 'unitPrice', value === '' ? 0 : parseFloat(value));
                                                                    }
                                                                }}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 text-right focus:ring-2 focus:ring-black focus:outline-none"
                                                                required
                                                            />
                                                        </div>

                                                        {/* 합계 */}
                                                        <div className="col-span-2 flex items-center justify-end">
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {formatCurrency(item.quantity * item.unitPrice)}
                                                            </span>
                                                        </div>

                                                        {/* 삭제 버튼 */}
                                                        <div className="col-span-1 flex items-center justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 transition-colors"
                                                                disabled={editItems.length === 1}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 총액 */}
                                        <div className="rounded-xl border border-gray-300 bg-gray-100 p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-base font-bold text-gray-900">총 금액</span>
                                                <span className="text-2xl font-extrabold text-gray-900">
                                                    {formatCurrency(calculateEditTotal())}
                                                </span>
                                            </div>
                                        </div>
                                    </form>
                                )
                            ) : null}
                        </div>

                        {/* 모달 푸터 (버튼) */}
                        {selectedOrder && (
                            <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-2">
                                {viewMode === 'VIEW' ? (
                                    <>
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
                                                    className="flex items-center justify-center gap-2 rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-700 transition-all active:scale-95 shadow-md"
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
                                    </>
                                ) : (
                                    /* EDIT 모드 버튼 */
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="flex items-center justify-center gap-2 rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-700 transition-all active:scale-95 shadow-md"
                                        >
                                            <X className="h-4 w-4" />
                                            취소
                                        </button>

                                        <button
                                            type="submit"
                                            onClick={handleUpdateSubmit}
                                            disabled={isSubmitting}
                                            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save className="h-4 w-4" />
                                            {isSubmitting ? '저장 중...' : '저장'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 메인 컨텐츠 */}
            <div className="min-h-screen bg-gray-50 py-8 px-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* 페이지 헤더 */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900">발주 관리</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                발주서를 생성하고 관리합니다.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
                            <div className="w-full md:w-auto">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value as PurchaseOrderStatus | 'ALL');
                                        setPage(0);
                                    }}
                                    className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none bg-white transition-all shadow-sm text-sm font-medium text-gray-900"
                                >
                                    <option value="ALL">전체</option>
                                    <option value="ORDERED">발주 완료</option>
                                    <option value="CANCELED">발주 취소</option>
                                </select>
                            </div>
                            <div className="relative w-full md:w-80">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <Search className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="주문번호 또는 거래처명으로 검색..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none bg-white transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="flex-1 md:flex-none bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-2 shadow-md text-sm font-bold"
                            >
                                <Plus className="w-4 h-4" /> 발주서 생성
                            </button>
                        </div>
                    </div>

                    <div className="text-sm text-gray-500 flex justify-between items-end px-1">
                        <div>
                            전체 <span className="font-bold text-gray-900">{pageData?.totalElements || 0}</span>건
                        </div>
                    </div>

                    {/* 테이블 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                {/* 헤더 */}
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">
                                            주문번호
                                        </th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">
                                            거래처
                                        </th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">
                                            상태
                                        </th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase text-right">
                                            총액
                                        </th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase text-right print:hidden">
                                            관리
                                        </th>
                                    </tr>
                                </thead>

                                {/* 바디 */}
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
                                                    <p className="text-sm">데이터 로딩 중...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : orders.length > 0 ? (
                                        orders.map((order) => (
                                            <tr
                                                key={order.purchaseOrderPublicId}
                                                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                                onClick={() => handleViewDetail(order.purchaseOrderPublicId)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-gray-600" />
                                                        <span className="font-medium text-gray-900">
                                                            {order.orderNo || 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="text-gray-700">
                                                        {order.vendorName || '거래처 없음'}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <StatusBadge status={order.status} />
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-semibold text-gray-900">
                                                        {formatCurrency(order.totalAmount)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-right print:hidden">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDetail(order.purchaseOrderPublicId);
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        상세보기
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <PackageSearch className="w-12 h-12 mx-auto mb-3 opacity-20 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            조회된 발주서가 없습니다
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            검색어를 변경하거나 새 발주서를 생성해보세요
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleCreate}
                                                        className="mt-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-900 transition-colors"
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

                        {/* 페이징 컨트롤 */}
                        {pageData && pageData.totalElements > 0 && (
                            <div className="flex justify-center items-center gap-4 py-6 border-t border-gray-100">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(page - 1)}
                                    className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-bold text-gray-600">
                                    {pageData.page + 1} / {pageData.totalPages}
                                </span>
                                <button
                                    disabled={!pageData.hasNext}
                                    onClick={() => setPage(page + 1)}
                                    className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}