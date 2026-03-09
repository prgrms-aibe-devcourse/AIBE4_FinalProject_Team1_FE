import React, { useEffect, useMemo, useState } from 'react';
import { requireStorePublicId } from '@/utils/store.ts';
import { getStockShortages } from '@/api/stock/stockShortage';
import type { StockShortageGroup } from '@/types/stock/stockShortage';
import {
    RefreshCw,
    Search,
    Loader2,
    Package,
    ArrowRight,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Calendar,
    Filter
} from 'lucide-react';

const StockShortagePage: React.FC = () => {
    const storePublicId = requireStorePublicId();

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [appliedFilters, setAppliedFilters] = useState<{
        from?: string;
        to?: string;
    }>({});

    const [data, setData] = useState<{
        content: StockShortageGroup[];
        totalElements: number;
        totalPages: number;
    }>({
        content: [],
        totalElements: 0,
        totalPages: 0
    });

    const buildOffsetDateTime = (date: string, isEnd = false) => {
        if (!date) return undefined;
        return isEnd
            ? `${date}T23:59:59+09:00`
            : `${date}T00:00:00+09:00`;
    };

    const fetchShortages = async () => {
        setIsLoading(true);
        try {
            const response = await getStockShortages(storePublicId, {
                page: currentPage,
                size: pageSize,
                from: appliedFilters.from,
                to: appliedFilters.to
            });

            setData({
                content: response.content,
                totalElements: response.totalElements,
                totalPages: response.totalPages
            });
        } catch (error) {
            console.error('재고 부족 현황 조회 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShortages();
    }, [storePublicId, currentPage, appliedFilters]);

    const handleApplyFilters = () => {
        if (fromDate && toDate && fromDate > toDate) {
            alert('시작일은 종료일보다 이후일 수 없습니다.');
            return;
        }

        setCurrentPage(0);
        setAppliedFilters({
            from: buildOffsetDateTime(fromDate, false),
            to: buildOffsetDateTime(toDate, true)
        });
    };

    const handleResetFilters = () => {
        setFromDate('');
        setToDate('');
        setSearchQuery('');
        setCurrentPage(0);
        setAppliedFilters({});
    };

    const handleRefresh = () => {
        fetchShortages();
    };

    const filteredContent = useMemo(() => {
        if (!searchQuery.trim()) return data.content;

        const keyword = searchQuery.toLowerCase();

        return data.content.filter(group =>
            group.salesOrderPublicId.toLowerCase().includes(keyword) ||
            group.shortages.some(item =>
                item.ingredientName.toLowerCase().includes(keyword)
            )
        );
    }, [searchQuery, data.content]);

    const visibleShortageCount = useMemo(() => {
        return filteredContent.reduce((acc, group) => acc + group.shortages.length, 0);
    }, [filteredContent]);

    const currentPageNumber = currentPage + 1;

    const paginationNumbers = useMemo(() => {
        const total = data.totalPages;
        const current = currentPage;
        const windowSize = 5;

        if (total <= windowSize) {
            return Array.from({ length: total }, (_, i) => i);
        }

        let start = Math.max(0, current - 2);
        let end = Math.min(total - 1, start + windowSize - 1);

        if (end - start < windowSize - 1) {
            start = Math.max(0, end - windowSize + 1);
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [currentPage, data.totalPages]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateRangeLabel = () => {
        if (!fromDate && !toDate && !appliedFilters.from && !appliedFilters.to) {
            return '전체 기간';
        }

        const start = fromDate || '전체';
        const end = toDate || '전체';
        return `${start} ~ ${end}`;
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 pb-10 pt-10">

            <header className="border-b border-gray-100 bg-white/95 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex h-20 items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900">재고 부족 현황</h1>
                            <p className="mt-3 text-sm text-gray-500">
                                관리 매장 식재료 실시간 현황
                            </p>
                        </div>

                        <button
                            onClick={handleRefresh}
                            className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-black text-white transition hover:bg-gray-800 shadow-xl shadow-slate-200 active:scale-95"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            현황 새로고침
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                                주문 기준
                            </span>
                        </div>
                        <div className="text-2xl font-black text-black">{data.totalElements}</div>
                        <p className="mt-3 text-sm text-gray-500">전체 부족 주문 수</p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                                현재 화면
                            </span>
                        </div>
                        <div className="text-2xl font-black text-black">{visibleShortageCount}</div>
                        <p className="mt-3 text-sm text-gray-500">현재 조건에서 보이는 부족 품목 수</p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                                조회 기간
                            </span>
                        </div>
                        <div className="text-base font-black text-black break-keep">{formatDateRangeLabel()}</div>
                        <p className="mt-3 text-sm text-gray-500">기간 지정 없으면 전체 조회</p>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <h2 className="text-sm font-black tracking-wide text-gray-700">조회 조건</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="lg:col-span-3">
                            <label className="mb-2 block text-xs font-bold text-gray-500">시작일</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-4 focus:ring-black/5"
                            />
                        </div>

                        <div className="lg:col-span-3">
                            <label className="mb-2 block text-xs font-bold text-gray-500">종료일</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-4 focus:ring-black/5"
                            />
                        </div>

                        <div className="lg:col-span-4">
                            <label className="mb-2 block text-xs font-bold text-gray-500">검색</label>
                            <div className="group relative">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black" />
                                <input
                                    type="text"
                                    placeholder="주문 번호 또는 품목명을 입력하세요"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-black focus:ring-4 focus:ring-black/5"
                                />
                            </div>
                        </div>

                        <div className="flex items-end gap-2 lg:col-span-2">
                            <button
                                onClick={handleApplyFilters}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-bold text-white transition hover:bg-gray-800"
                            >
                                <Search className="h-4 w-4" />
                                조회
                            </button>
                            <button
                                onClick={handleResetFilters}
                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-50 gap-2"
                                title="초기화"
                            >
                                <RotateCcw className="h-4 w-4" />
                                초기화
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                        기간을 지정하지 않으면 전체 데이터를 조회합니다. 검색어는 현재 페이지 결과 안에서 주문번호와 품목명을 필터링합니다.
                    </div>
                </section>

                <div className="space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 text-gray-400 shadow-sm gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-black" />
                            <p className="font-bold text-gray-600">데이터를 불러오는 중입니다...</p>
                        </div>
                    ) : filteredContent.length > 0 ? (
                        filteredContent.map((group) => (
                            <section
                                key={group.salesOrderPublicId}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-black" />
                                        <span className="text-sm font-black uppercase tracking-widest text-gray-400">
                                            Order ID
                                        </span>
                                        <span className="break-all font-bold text-black">
                                            {group.salesOrderPublicId}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-500">
                                        <Calendar className="h-3 w-3 text-gray-400" />
                                        발생 일시: {formatDate(group.createdAt)}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-black uppercase tracking-widest text-gray-400">
                                                <th className="px-6 py-3">품목 정보</th>
                                                <th className="px-6 py-3 text-center">주문 필요량</th>
                                                <th className="px-6 py-3 text-center">현재 가용고</th>
                                                <th className="bg-gray-100 px-6 py-3 text-center text-black">부족 수량</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {group.shortages.map((item) => (
                                                <tr
                                                    key={item.stockShortagePublicId}
                                                    className="transition hover:bg-gray-50/70"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100/80">
                                                                <Package className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900">
                                                                    {item.ingredientName}
                                                                </div>
                                                                <div className="text-[10px] font-bold uppercase text-gray-400">
                                                                    Code: {item.ingredientPublicId.substring(0, 8)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                                                        {item.requiredAmount.toLocaleString()} {item.unit}
                                                    </td>

                                                    <td className="px-6 py-4 text-center text-sm font-bold text-gray-500">
                                                        {Math.max(0, item.requiredAmount - item.shortageAmount).toLocaleString()} {item.unit}
                                                    </td>

                                                    <td className="bg-gray-100 px-6 py-4 text-center">
                                                        <span className="inline-flex items-center gap-1.5 font-black text-black">
                                                            <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                                                            {item.shortageAmount.toLocaleString()} {item.unit}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-gray-400 shadow-sm">
                            <AlertCircle className="mb-4 h-12 w-12 opacity-20 text-gray-300" />
                            <p className="font-bold text-gray-700">조건에 맞는 재고 부족 내역이 없습니다.</p>
                            <p className="mt-2 text-sm text-gray-400">기간을 넓히거나 검색어를 초기화해보세요.</p>
                        </div>
                    )}
                </div>

                {data.totalPages > 1 && (
                    <div className="mt-10 space-y-4">
                        <div className="flex justify-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
                                <span>페이지</span>
                                <span className="font-black text-black">{currentPageNumber}</span>
                                <span>/</span>
                                <span>{data.totalPages}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${currentPage === 0
                                    ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                이전
                            </button>

                            {paginationNumbers[0] > 0 && (
                                <>
                                    <button
                                        onClick={() => setCurrentPage(0)}
                                        className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:border-gray-300"
                                    >
                                        1
                                    </button>
                                    {paginationNumbers[0] > 1 && (
                                        <span className="px-1 font-bold text-gray-400">...</span>
                                    )}
                                </>
                            )}

                            {paginationNumbers.map((pageIndex) => (
                                <button
                                    key={pageIndex}
                                    onClick={() => setCurrentPage(pageIndex)}
                                    className={`h-10 w-10 rounded-lg border text-sm font-bold transition-all ${currentPage === pageIndex
                                        ? 'border-black bg-black text-white'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageIndex + 1}
                                </button>
                            ))}

                            {paginationNumbers[paginationNumbers.length - 1] < data.totalPages - 1 && (
                                <>
                                    {paginationNumbers[paginationNumbers.length - 1] < data.totalPages - 2 && (
                                        <span className="px-1 font-bold text-gray-400">...</span>
                                    )}
                                    <button
                                        onClick={() => setCurrentPage(data.totalPages - 1)}
                                        className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                                    >
                                        {data.totalPages}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(data.totalPages - 1, p + 1))}
                                disabled={currentPage === data.totalPages - 1}
                                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${currentPage === data.totalPages - 1
                                    ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                다음
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <footer className="mt-10 border-t border-gray-200 pt-8 pb-12">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                        Inventory Control System • Internal Log
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default StockShortagePage;