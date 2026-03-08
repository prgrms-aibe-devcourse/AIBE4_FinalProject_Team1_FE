import { useEffect, useState } from "react";
import { getStockInbounds } from "@/api/stock/stock.ts";
import type { StockInboundListResponse } from "@/types";
import { requireStorePublicId } from "@/utils/store";
import InboundDetailModal from "@/components/stock/InboundDetailModal";

function formatDateTime(dateStr?: string | null) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function StockInboundPage() {
    const storePublicId = requireStorePublicId();

    const [inbounds, setInbounds] = useState<StockInboundListResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedInboundId, setSelectedInboundId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchList = async (page: number = 0) => {
        if (!storePublicId) return;
        try {
            setLoading(true);
            const data = await getStockInbounds(storePublicId, page, 20);

            // CONFIRMED 상태만 필터링
            const confirmedInbounds = data.content?.filter(
                (inbound) => inbound.status === "CONFIRMED"
            ) || [];

            setInbounds(confirmedInbounds);
            setTotalPages(data.totalPages || 0);
            setCurrentPage(page);
        } catch (error) {
            console.error("입고 목록 로드 실패:", error);
            setInbounds([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList(0);
    }, [storePublicId]);

    const handleRowClick = (publicId: string) => {
        setSelectedInboundId(publicId);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedInboundId(null);
    };

    const handlePageChange = (page: number) => {
        fetchList(page);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto w-full max-w-7xl px-6 py-8">
                {/* 헤더 */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">입고 내역</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            확정된 입고 목록을 확인할 수 있습니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchList(currentPage)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        새로고침
                    </button>
                </div>

                {/* 목록 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="inline-block animate-spin text-4xl text-gray-300 mb-4">⟳</div>
                            <p className="text-gray-400 font-bold">데이터를 불러오는 중...</p>
                        </div>
                    ) : inbounds.length === 0 ? (
                        <div className="p-20 text-center">
                            <p className="text-gray-400 font-bold text-lg">확정된 입고 내역이 없습니다.</p>
                            <p className="text-gray-400 text-sm mt-2">입고 등록 후 확정하면 여기에 표시됩니다.</p>
                        </div>
                    ) : (
                        <>
                            {/* 테이블 헤더 */}
                            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                                <div className="grid grid-cols-12 gap-4 text-xs font-black text-gray-500 uppercase">
                                    <div className="col-span-3">거래처</div>
                                    <div className="col-span-3">확정 일시</div>
                                    <div className="col-span-2">확정자</div>
                                    <div className="col-span-2">상태</div>
                                    <div className="col-span-2 text-right">작업</div>
                                </div>
                            </div>

                            {/* 목록 */}
                            <div className="divide-y divide-gray-100">
                                {inbounds.map((inbound) => (
                                    <div
                                        key={inbound.inboundPublicId}
                                        className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => handleRowClick(inbound.inboundPublicId)}
                                    >
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            {/* 거래처 */}
                                            <div className="col-span-3">
                                                <div className="font-bold text-gray-900">
                                                    {inbound.vendorName || "거래처 미지정"}
                                                </div>
                                                <div className="text-xs text-gray-400 font-mono mt-0.5">
                                                    {inbound.inboundPublicId.split("-")[0]}
                                                </div>
                                            </div>

                                            {/* 확정 일시 */}
                                            <div className="col-span-3 text-sm text-gray-600">
                                                {formatDateTime(inbound.confirmedAt)}
                                            </div>

                                            {/* 확정자 */}
                                            <div className="col-span-2 text-sm text-gray-600">
                                                {inbound.confirmedByUserName || "-"}
                                            </div>

                                            {/* 상태 */}
                                            <div className="col-span-2">
                                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                    CONFIRMED
                                                </span>
                                            </div>

                                            {/* 작업 */}
                                            <div className="col-span-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRowClick(inbound.inboundPublicId);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    상세
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 페이징 */}
                            {totalPages > 1 && (
                                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 0}
                                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        이전
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            const pageNum = currentPage < 3 ? i : currentPage - 2 + i;
                                            if (pageNum >= totalPages) return null;

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                                        pageNum === currentPage
                                                            ? "bg-gray-900 text-white"
                                                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {pageNum + 1}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= totalPages - 1}
                                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        다음
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* 상세 모달 */}
            <InboundDetailModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                storePublicId={storePublicId}
                inboundPublicId={selectedInboundId}
                onConfirmSuccess={() => {
                    fetchList(currentPage);
                }}
            />
        </div>
    );
}
