import { useEffect, useMemo, useState } from "react";
import { getStockInbounds } from "@/api/stock/stock.ts";
import type { StockInboundListResponse, InboundSearchCondition } from "@/types";
import { requireStorePublicId } from "@/utils/store";
import InboundDetailModal from "@/components/stock/InboundDetailModal";

function formatDate(dateStr?: string | null) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

function formatDateTime(dateStr?: string | null) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
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

    const [searchCondition, setSearchCondition] = useState<InboundSearchCondition>({});
    const [tempCondition, setTempCondition] = useState<InboundSearchCondition>({});
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const fetchList = async (page: number = 0, condition: InboundSearchCondition = {}, sort: 'desc' | 'asc' = 'desc') => {
        if (!storePublicId) return;

        try {
            setLoading(true);
            const sortParam = `createdAt,${sort}`;
            const data = await getStockInbounds(storePublicId, condition, page, 20, sortParam);

            const confirmedInbounds =
                data.content?.filter((inbound) => inbound.status === "CONFIRMED") || [];

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
        fetchList(0, searchCondition, sortOrder);
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
        fetchList(page, searchCondition, sortOrder);
    };

    const handleSearch = () => {
        setSearchCondition(tempCondition);
        fetchList(0, tempCondition, sortOrder);
    };

    const handleReset = () => {
        const emptyCondition = {};
        setTempCondition(emptyCondition);
        setSearchCondition(emptyCondition);
        fetchList(0, emptyCondition, sortOrder);
    };

    const handleSortChange = (order: 'desc' | 'asc') => {
        setSortOrder(order);
        fetchList(currentPage, searchCondition, order);
    };

    const hasData = useMemo(() => inbounds.length > 0, [inbounds]);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="mx-auto w-full max-w-7xl px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">입고 내역</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        확정 완료된 입고 문서를 조회합니다.
                    </p>
                </div>

                <div className="mb-6 border border-gray-200 bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">검색 조건</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-gray-700">
                                    입고일자 (시작)
                                </label>
                                <input
                                    type="date"
                                    value={tempCondition.inboundDateFrom || ''}
                                    onChange={(e) => setTempCondition({ ...tempCondition, inboundDateFrom: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-gray-700">
                                    입고일자 (종료)
                                </label>
                                <input
                                    type="date"
                                    value={tempCondition.inboundDateTo || ''}
                                    onChange={(e) => setTempCondition({ ...tempCondition, inboundDateTo: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold text-gray-700">
                                거래처명
                            </label>
                            <input
                                type="text"
                                value={tempCondition.vendorName || ''}
                                onChange={(e) => setTempCondition({ ...tempCondition, vendorName: e.target.value })}
                                placeholder="거래처명으로 검색"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold text-gray-700">
                                품목명
                            </label>
                            <input
                                type="text"
                                value={tempCondition.itemKeyword || ''}
                                onChange={(e) => setTempCondition({ ...tempCondition, itemKeyword: e.target.value })}
                                placeholder="품목명으로 검색 (예: 식빵, 체다치즈)"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold text-gray-700">
                                입고번호
                            </label>
                            <input
                                type="text"
                                value={tempCondition.inboundPublicId || ''}
                                onChange={(e) => setTempCondition({ ...tempCondition, inboundPublicId: e.target.value })}
                                placeholder="입고번호로 검색 (예: 93ac11e2)"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-black transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            검색
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            초기화
                        </button>
                    </div>
                </div>

                <div className="border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">입고 목록</h3>
                            <select
                                value={sortOrder}
                                onChange={(e) => handleSortChange(e.target.value as 'desc' | 'asc')}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                            >
                                <option value="desc">최신순</option>
                                <option value="asc">과거순</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-12 gap-4 text-xs font-black uppercase tracking-wide text-gray-500">
                            <div className="col-span-3">입고번호</div>
                            <div className="col-span-3">거래처</div>
                            <div className="col-span-2">입고일자</div>
                            <div className="col-span-1">품목 수</div>
                            <div className="col-span-2">확정일시</div>
                            <div className="col-span-1 text-right">상세</div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="px-6 py-20 text-center">
                            <p className="text-sm font-bold text-gray-400">데이터를 불러오는 중...</p>
                        </div>
                    ) : !hasData ? (
                        <div className="px-6 py-20 text-center">
                            <p className="text-base font-bold text-gray-500">확정된 입고 내역이 없습니다.</p>
                            <p className="mt-2 text-sm text-gray-400">
                                입고 등록 및 확정 후 이 목록에 표시됩니다.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {inbounds.map((inbound) => (
                                <div
                                    key={inbound.inboundPublicId}
                                    className="cursor-pointer px-6 py-5 hover:bg-gray-50 transition-colors"
                                    onClick={() => handleRowClick(inbound.inboundPublicId)}
                                >
                                    <div className="grid grid-cols-12 items-center gap-4">
                                        <div className="col-span-3">
                                            <div className="truncate font-mono text-sm font-bold text-gray-900">
                                                {inbound.inboundPublicId.substring(0, 8)}
                                            </div>
                                        </div>

                                        <div className="col-span-3">
                                            <div className="text-sm font-bold text-gray-900">
                                                {inbound.vendorName || "거래처 미지정"}
                                            </div>
                                        </div>

                                        <div className="col-span-2 text-sm text-gray-700">
                                            {formatDate(inbound.inboundDate)}
                                        </div>

                                        <div className="col-span-1 text-sm font-bold text-gray-900">
                                            {inbound.itemCount ?? 0}
                                        </div>

                                        <div className="col-span-2 text-sm text-gray-700">
                                            {formatDateTime(inbound.confirmedAt)}
                                        </div>

                                        <div className="col-span-1 text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRowClick(inbound.inboundPublicId);
                                                }}
                                                className="inline-flex items-center justify-center rounded-md border border-gray-900 bg-gray-900 px-3 py-2 text-xs font-black text-white hover:bg-black transition-colors"
                                            >
                                                상세
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-6 py-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
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
                                            className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${
                                                pageNum === currentPage
                                                    ? "bg-gray-900 text-white"
                                                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
                            >
                                다음
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <InboundDetailModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                storePublicId={storePublicId}
                inboundPublicId={selectedInboundId}
                onConfirmSuccess={() => {
                    fetchList(currentPage, searchCondition, sortOrder);
                }}
            />
        </div>
    );
}