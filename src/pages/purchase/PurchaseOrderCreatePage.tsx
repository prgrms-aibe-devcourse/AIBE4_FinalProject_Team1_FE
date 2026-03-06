import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPurchaseOrder } from '@/api/purchase';
import { getVendors } from '@/api/vendor';
import { requireStorePublicId } from '@/utils/store';
import type { PurchaseOrderItemRequest } from '@/types/purchase/purchase.ts';
import type { VendorResponse } from '@/types/reference/vendor.ts';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

export default function PurchaseOrderCreatePage() {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState<VendorResponse[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [items, setItems] = useState<PurchaseOrderItemRequest[]>([
        { itemName: '', quantity: 1, unitPrice: 0 }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const storePublicId = requireStorePublicId();
                const response = await getVendors(storePublicId, 'ACTIVE');
                setVendors(response.data);
            } catch (error) {
                console.error('거래처 목록 조회 실패:', error);
                alert('거래처 목록을 불러오는데 실패했습니다.');
            }
        };

        fetchVendors();
    }, []);

    const handleAddItem = () => {
        setItems([...items, { itemName: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length === 1) {
            alert('최소 1개의 발주 항목이 필요합니다.');
            return;
        }
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (
        index: number,
        field: keyof PurchaseOrderItemRequest,
        value: string | number
    ) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateTotal = (): number => {
        return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    };

    const formatCurrency = (amount: number): string => {
        return `₩${amount.toLocaleString('ko-KR')}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!selectedVendorId) {
            alert('거래처를 선택해주세요.');
            return;
        }

        if (items.some((item) => !item.itemName.trim())) {
            alert('품목명을 입력해주세요.');
            return;
        }

        if (items.some((item) => item.quantity < 1)) {
            alert('수량은 1 이상이어야 합니다.');
            return;
        }

        if (items.some((item) => item.unitPrice <= 0)) {
            alert('단가는 0보다 커야 합니다.');
            return;
        }

        try {
            setIsSubmitting(true);
            const storePublicId = requireStorePublicId();
            await createPurchaseOrder(storePublicId, {
                vendorPublicId: selectedVendorId,
                items
            });
            alert('발주서가 생성되었습니다.');
            navigate('/purchase-orders');
        } catch (error) {
            console.error('발주서 생성 실패:', error);
            alert('발주서 생성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (confirm('발주서 생성을 취소하시겠습니까?')) {
            navigate('/purchase-orders');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-[72px]">
            <div className="mx-auto max-w-4xl px-6 py-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => navigate('/purchase-orders')}
                        className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        발주 목록으로
                    </button>
                    <h1 className="text-3xl font-extrabold text-slate-900">발주서 생성</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        거래처와 발주 항목을 입력하세요
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 거래처 선택 */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                            거래처 <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={selectedVendorId}
                            onChange={(e) => setSelectedVendorId(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                            required
                        >
                            <option value="">거래처를 선택하세요</option>
                            {vendors.map((vendor) => (
                                <option key={vendor.vendorPublicId} value={vendor.vendorPublicId}>
                                    {vendor.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 발주 항목 */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <label className="block text-sm font-bold text-slate-700">
                                발주 항목 <span className="text-rose-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                항목 추가
                            </button>
                        </div>

                        <div className="space-y-3">
                            {/* 테이블 헤더 */}
                            <div className="grid grid-cols-12 gap-3 px-4 py-2">
                                <div className="col-span-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase">품목명</span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase">수량</span>
                                </div>
                                <div className="col-span-3 text-right">
                                    <span className="text-xs font-bold text-slate-500 uppercase">단가</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-xs font-bold text-slate-500 uppercase">합계</span>
                                </div>
                                <div className="col-span-1"></div>
                            </div>

                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-12 gap-3 items-start p-4 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors"
                                >
                                    {/* 품목명 */}
                                    <div className="col-span-4">
                                        <input
                                            type="text"
                                            placeholder="예: 양파, 감자"
                                            value={item.itemName}
                                            onChange={(e) =>
                                                handleItemChange(index, 'itemName', e.target.value)
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                            required
                                        />
                                    </div>

                                    {/* 수량 */}
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            placeholder="1"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 text-center focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                            required
                                        />
                                    </div>

                                    {/* 단가 */}
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            placeholder="10000"
                                            min="0"
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={(e) =>
                                                handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 text-right focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                            required
                                        />
                                    </div>

                                    {/* 합계 */}
                                    <div className="col-span-2 flex items-center justify-end">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                                    </div>

                                    {/* 삭제 버튼 */}
                                    <div className="col-span-1 flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 transition-colors"
                                            disabled={items.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 총액 */}
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-slate-900">총 금액</span>
                            <span className="text-2xl font-extrabold text-amber-700">
                {formatCurrency(calculateTotal())}
              </span>
                        </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white hover:bg-amber-700 transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '생성 중...' : '발주서 생성'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}