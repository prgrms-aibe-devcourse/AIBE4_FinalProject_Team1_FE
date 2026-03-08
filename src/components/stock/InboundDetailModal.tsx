import { useState, useEffect } from "react";
import { getStockInboundDetail } from "@/api/stock/stock.ts";
import type { StockInboundResponse } from "@/types";

interface InboundDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    storePublicId: string;
    inboundPublicId: string | null;
    onConfirmSuccess: () => void;
}

const formatInboundNumber = (publicId: string) => {
    return publicId.substring(0, 8);
};

export default function InboundDetailModal({
    isOpen,
    onClose,
    storePublicId,
    inboundPublicId,
}: InboundDetailModalProps) {
    const [inbound, setInbound] = useState<StockInboundResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && inboundPublicId) {
            const fetchDetail = async () => {
                try {
                    setLoading(true);
                    const data = await getStockInboundDetail(storePublicId, inboundPublicId);
                    setInbound(data);
                } catch (error) {
                    console.error("상세 로드 실패:", error);
                    alert("상세 정보를 불러올 수 없습니다.");
                    onClose();
                } finally {
                    setLoading(false);
                }
            };
            fetchDetail();
        }
    }, [isOpen, inboundPublicId, storePublicId]);

    if (!isOpen) return null;

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateTotalCost = (items: StockInboundResponse['items']) => {
        return items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
            ></div>

            {/* Modal Body */}
            <div className="relative bg-gray-50 w-full max-w-5xl max-h-[90vh] rounded-lg border border-gray-300 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="inline-block animate-spin text-4xl text-gray-400 mb-4">⟳</div>
                        <p className="text-gray-500 text-sm">데이터를 불러오는 중...</p>
                    </div>
                ) : inbound ? (
                    <>
                        {/* 헤더 */}
                        <div className="px-6 py-4 border-b border-gray-300 bg-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">입고 상세</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* 내용 */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* 메타 정보 */}
                            <div className="bg-white border border-gray-200 p-4">
                                <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">입고번호</div>
                                        <div className="text-sm text-gray-900 font-mono">
                                            {formatInboundNumber(inbound.inboundPublicId)}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">거래처</div>
                                        <div className="text-sm text-gray-900">
                                            {inbound.vendorName || "거래처 미지정"}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">입고일자</div>
                                        <div className="text-sm text-gray-900">
                                            {formatDate(inbound.inboundDate)}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">품목 수</div>
                                        <div className="text-sm text-gray-900">
                                            {inbound.itemCount ?? inbound.items.length}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">확정일시</div>
                                        <div className="text-sm text-gray-900">
                                            {formatDateTime(inbound.confirmedAt)}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">총 비용</div>
                                        <div className="text-sm text-gray-900">
                                            ₩{(inbound.totalCost ?? calculateTotalCost(inbound.items)).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {inbound.confirmedByUserName && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-400">
                                            확정자: {inbound.confirmedByUserName}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 품목 테이블 */}
                            <div className="bg-white border border-gray-200">
                                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                    <h4 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                                        입고 품목
                                    </h4>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">품목명</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">매핑 재료</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">수량</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">단가</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">금액</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">유통기한</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {inbound.items.map((item, idx) => {
                                                const total = item.quantity * item.unitCost;
                                                const mappedIngredient = item.ingredientName || item.normalizedRawKey || '-';

                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {item.rawProductName}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {mappedIngredient}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                                                            ₩{item.unitCost.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                                            ₩{total.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                                                            {item.expirationDate ? formatDate(item.expirationDate) : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-gray-50 border-t border-gray-200">
                                            <tr>
                                                <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                                                    총 비용
                                                </td>
                                                <td colSpan={2} className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                                                    ₩{calculateTotalCost(inbound.items).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* 하단 버튼 */}
                        <div className="px-6 py-4 border-t border-gray-300 bg-white">
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
