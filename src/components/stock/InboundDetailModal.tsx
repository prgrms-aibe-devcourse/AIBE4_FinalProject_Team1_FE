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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Body */}
            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="inline-block animate-spin text-5xl text-gray-300 mb-4">⟳</div>
                        <p className="text-gray-400 font-bold">데이터를 불러오는 중...</p>
                    </div>
                ) : inbound ? (
                    <>
                        {/* 헤더 */}
                        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">입고 상세 내역</h3>
                                <p className="text-xs text-gray-400 mt-1 font-mono">
                                    ID: {inbound.inboundPublicId}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* 내용 */}
                        <div className="p-8 overflow-y-auto space-y-8">
                            {/* 기본 정보 */}
                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                        거래처명
                                    </label>
                                    <p className="text-lg font-black text-gray-900 mt-1">
                                        {inbound.vendorName || "거래처 미지정"}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                        상태
                                    </label>
                                    <p className="text-lg font-black text-gray-700 mt-1 flex items-center gap-2">
                                        <span className="px-3 py-1 rounded-lg text-sm bg-gray-100 border border-gray-200">
                                            CONFIRMED
                                        </span>
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                        확정 일시
                                    </label>
                                    <p className="text-sm font-bold text-gray-700 mt-1">
                                        {formatDateTime(inbound.confirmedAt)}
                                    </p>
                                </div>

                                {inbound.confirmedByUserName && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                            확정자
                                        </label>
                                        <p className="text-sm font-bold text-gray-700 mt-1">
                                            {inbound.confirmedByUserName}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 품목 테이블 */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    입고 품목
                                </h4>

                                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-black text-gray-700">품목명</th>
                                                <th className="px-4 py-4 text-center font-black text-gray-700">수량</th>
                                                <th className="px-4 py-4 text-right font-black text-gray-700">단가</th>
                                                <th className="px-4 py-4 text-right font-black text-gray-700">합계</th>
                                                <th className="px-6 py-4 text-center font-black text-gray-700">유통기한</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {inbound.items.map((item, idx) => {
                                                const total = item.quantity * item.unitCost;
                                                const expirationDate = item.expirationDate ? new Date(item.expirationDate) : null;
                                                const isExpiringSoon = expirationDate && expirationDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-900">
                                                            {item.ingredientName || item.rawProductName}
                                                        </td>
                                                        <td className="px-4 py-4 text-center font-black text-gray-800">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-4 py-4 text-right text-gray-600">
                                                            ₩{item.unitCost.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-4 text-right font-bold text-gray-900">
                                                            ₩{total.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {item.expirationDate ? (
                                                                <span
                                                                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono ${
                                                                        isExpiringSoon
                                                                            ? "bg-red-50 text-red-600 border border-red-200"
                                                                            : "bg-gray-50 text-gray-600 border border-gray-200"
                                                                    }`}
                                                                >
                                                                    {formatDate(item.expirationDate)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-300 text-xs">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-4 text-right font-black text-gray-700">
                                                    총 합계
                                                </td>
                                                <td colSpan={2} className="px-6 py-4 text-right font-black text-gray-900 text-lg">
                                                    ₩
                                                    {inbound.items
                                                        .reduce((acc, item) => acc + item.quantity * item.unitCost, 0)
                                                        .toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* 하단 버튼 */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 font-bold text-white bg-gray-900 hover:bg-black rounded-2xl transition-colors"
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
