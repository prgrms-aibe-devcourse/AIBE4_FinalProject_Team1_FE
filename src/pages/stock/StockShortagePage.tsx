import React, { useState, useEffect, useMemo } from 'react';
import {
    AlertTriangle,
    Package,
    Search,
    ArrowRight,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
    Box,
    Loader2
} from 'lucide-react';
import { requireStorePublicId } from '@/utils/store.ts';
import { getStockShortages } from '@/api/stock/stockShortage';
import type { StockShortageGroup } from '@/types/stock/stockShortage';

const StockTakeShortagePage: React.FC = () => {
    const storePublicId = requireStorePublicId();

    // --- 상태 관리 ---
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0); // API는 0-indexed
    const [pageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        content: StockShortageGroup[];
        totalElements: number;
        totalPages: number;
    }>({
        content: [],
        totalElements: 0,
        totalPages: 0
    });

    // --- 데이터 페칭 ---
    const fetchShortages = async () => {
        setIsLoading(true);
        try {
            const response = await getStockShortages(storePublicId, currentPage, pageSize);
            setData({
                content: response.content,
                totalElements: response.totalElements,
                totalPages: response.totalPages
            });
        } catch (error) {
            console.error('재고 부족 현황 조회 실패:', error);
            // 에러 처리 (필요시 알림 등)
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShortages();
    }, [storePublicId, currentPage]);

    // --- 검색 필터링 (클라이언트 측 - 현재 페이지 데이터 기준) ---
    const filteredContent = useMemo(() => {
        if (!searchQuery) return data.content;
        return data.content.filter(group =>
            group.shortages.some(item =>
                item.ingredientName.toLowerCase().includes(searchQuery.toLowerCase())
            ) || group.salesOrderPublicId.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, data.content]);

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

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">

            {/* HEADER */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-rose-500 p-2 rounded-lg text-white">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold tracking-tight">재고 부족 현황</h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                                    Store ID: {storePublicId.substring(0, 8)}...
                                </p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 text-sm font-bold text-slate-500">
                            <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full ring-1 ring-rose-200">
                                <Box className="w-4 h-4" />
                                부족 품목 {data.totalElements}건 (주문 기준)
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                {/* SEARCH BAR */}
                <div className="mb-8">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="주문 번호 또는 품목명을 입력하세요..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition shadow-sm text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* LOG CONTENT AREA */}
                <div className="space-y-8">
                    {isLoading ? (
                        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="w-10 h-10 mb-4 animate-spin text-indigo-500" />
                            <p className="font-bold text-slate-500">데이터를 불러오는 중입니다...</p>
                        </div>
                    ) : filteredContent.length > 0 ? (
                        filteredContent.map((group) => (
                            <section
                                key={group.salesOrderPublicId}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
                            >
                                {/* Order Summary Header */}
                                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Order ID</span>
                                        <span className="font-bold text-slate-900">{group.salesOrderPublicId}</span>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 bg-white border px-3 py-1.5 rounded-full flex items-center gap-2">
                                        <ShoppingCart className="w-3 h-3 text-slate-400" />
                                        발생 일시: {formatDate(group.createdAt)}
                                    </div>
                                </div>

                                {/* Shortage Item Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[11px] font-black text-slate-400 bg-slate-50/30 border-b border-slate-100 uppercase tracking-widest">
                                                <th className="px-6 py-3">품목 정보</th>
                                                <th className="px-6 py-3 text-center">주문 필요량</th>
                                                <th className="px-6 py-3 text-center">현재 가용고</th>
                                                <th className="px-6 py-3 text-center bg-rose-50/50 text-rose-600">부족 수량</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {group.shortages.map((item) => (
                                                <tr key={item.stockShortagePublicId} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                                                <Package className="w-4 h-4 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800 text-sm">{item.ingredientName}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase">CODE: {item.ingredientPublicId.substring(0, 8)}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-sm">
                                                        {item.requiredAmount.toLocaleString()} {item.unit}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-sm text-slate-400">
                                                        {Math.max(0, item.requiredAmount - item.shortageAmount).toLocaleString()} {item.unit}
                                                    </td>
                                                    <td className="px-6 py-4 text-center bg-rose-50/50">
                                                        <span className="inline-flex items-center font-black text-rose-600">
                                                            <ArrowRight className="w-3 h-3 mr-1" />
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
                        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-24 flex flex-col items-center justify-center text-slate-400">
                            <Package className="w-12 h-12 mb-4 opacity-10" />
                            <p className="font-bold text-slate-500">부족한 재고가 없거나 검색 결과가 없습니다.</p>
                        </div>
                    )}
                </div>

                {/* NUMERIC PAGINATION */}
                {data.totalPages > 1 && (
                    <div className="mt-12 flex justify-center items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className={`p-2 rounded-lg border transition ${currentPage === 0 ? 'text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed' : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex gap-2">
                            {[...Array(data.totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${currentPage === i
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(data.totalPages - 1, p + 1))}
                            disabled={currentPage === data.totalPages - 1}
                            className={`p-2 rounded-lg border transition ${currentPage === data.totalPages - 1 ? 'text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed' : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

            </main>

            <footer className="mt-10 border-t border-slate-200 pt-8 pb-12">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                        Inventory Control System • Internal Log
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default StockTakeShortagePage;
