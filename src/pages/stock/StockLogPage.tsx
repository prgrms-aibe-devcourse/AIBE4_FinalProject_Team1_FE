import React, {useState, useEffect, useCallback} from 'react';
import type {StockLogResponse, TransactionType, StockLogSearchCondition} from '@/types/stock/stockLog';
import {getStockLogs} from '@/api/stock/stock.ts';
import {requireStorePublicId} from "@/utils/store.ts";

const StockLogPage: React.FC = () => {
    const storePublicId = requireStorePublicId();

    // FilterType 정의
    type FilterType = TransactionType | 'ALL';

    // --- [상태 관리] ---
    const [loading, setLoading] = useState(false);
    const [stockHistory, setStockHistory] = useState<StockLogResponse[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // 검색 필터 상태
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<FilterType>('ALL');

    // --- [유형별 색상 및 아이콘 설정] ---
    const getTypeConfig = (type: TransactionType | undefined) => {
        // type이 없는 경우에 대한 기본값 처리
        if (!type) return {label: '기타', icon: 'ph-question', bg: 'bg-gray-50', text: 'text-gray-600'};

        const configs: Record<TransactionType, { label: string; icon: string; bg: string; text: string }> = {
            INBOUND: {label: '입고', icon: 'ph-arrow-down-left', bg: 'bg-blue-50', text: 'text-blue-600'},
            DEDUCTION: {label: '판매', icon: 'ph-shopping-cart', bg: 'bg-red-50', text: 'text-red-600'},
            WASTE: {label: '폐기', icon: 'ph-trash', bg: 'bg-red-50', text: 'text-red-600'},
            ADJUST: {label: '조정', icon: 'ph-scales', bg: 'bg-amber-50', text: 'text-amber-600'}
        };
        return configs[type];
    };

    // 수량 색상 결정
    const getQtyColorClass = (type: TransactionType | undefined, value: number | undefined) => {
        if (!value) return 'text-gray-800';
        if (type === 'ADJUST') return 'text-amber-600';
        return value > 0 ? 'text-blue-600' : 'text-red-600';
    };

    // --- [데이터 패칭] ---
    const fetchLogs = useCallback(async (page: number) => {
        if (!storePublicId) return;
        setLoading(true);
        try {
            // 이제 인터페이스 정의에 의해 typeFilter가 'ALL'이면 undefined가 할당되어도 에러가 나지 않습니다.
            const condition: StockLogSearchCondition = {
                ingredientName: searchQuery || undefined,
                type: typeFilter === 'ALL' ? undefined : typeFilter,
                startAt: startDate ? `${startDate}T00:00:00Z` : undefined,
                endAt: endDate ? `${endDate}T23:59:59Z` : undefined,
            };

            const response = await getStockLogs(storePublicId, condition, page, 50);

            if (page === 0) setStockHistory(response.content);
            else setStockHistory(prev => [...prev, ...response.content]);

            setTotalPages(response.totalPages);
            setCurrentPage(response.currentPage);
            setTotalElements(response.totalElements);
        } catch (error) {
            console.error("데이터 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    }, [storePublicId, searchQuery, typeFilter, startDate, endDate]);

    useEffect(() => {
        fetchLogs(0);
    }, [fetchLogs]);

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-gray-50 text-gray-900 font-sans">
            {/* 상단 네비게이션 */}
            <nav className="bg-[#1a1a1a] h-16 flex items-center justify-between px-6 shadow-md z-30">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <i className="ph-fill ph-clock-counter-clockwise text-white text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">재고<span
                                className="text-gray-400">이력</span></h1>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Stock
                                Movement Logs</p>
                        </div>
                    </div>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-300 hover:text-white border border-gray-700 rounded-lg transition-all">
                    <i className="ph ph-file-csv"></i> 로그 내보내기 (CSV)
                </button>
            </nav>

            <main className="flex-1 overflow-hidden flex flex-col p-8">
                <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-6">
                    {/* 필터 영역 */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="relative flex-1">
                            <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="품목명 검색..."
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3">
                                <i className="ph ph-calendar text-gray-400"></i>
                                <input type="date" className="bg-transparent text-xs font-bold py-3 outline-none"
                                       value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
                                <span className="text-gray-300">~</span>
                                <input type="date" className="bg-transparent text-xs font-bold py-3 outline-none"
                                       value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
                            </div>
                            <select
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as FilterType)}
                            >
                                <option value="ALL">전체 변동 유형</option>
                                <option value="INBOUND">입고 (+)</option>
                                <option value="DEDUCTION">판매 (-)</option>
                                <option value="WASTE">폐기 (-)</option>
                                <option value="ADJUST">조정 (±)</option>
                            </select>
                        </div>
                    </div>

                    {/* 이력 리스트 영역 */}
                    <div
                        className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead
                                    className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 font-bold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 w-44">날짜/시간</th>
                                    <th className="px-6 py-4 w-32">유형</th>
                                    <th className="px-6 py-4">품목 정보</th>
                                    <th className="px-6 py-4 text-right">변동 수량</th>
                                    <th className="px-6 py-4 text-right">최종 재고</th>
                                    <th className="px-6 py-4">처리자</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {loading && currentPage === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 text-gray-400">데이터를 불러오는 중...</td>
                                    </tr>
                                ) : stockHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 text-gray-400">조회된 내역이 없습니다.</td>
                                    </tr>
                                ) : (
                                    stockHistory.map((log, index) => {
                                        const config = getTypeConfig(log.type);
                                        const qtyColor = getQtyColorClass(log.type, log.changeQuantity);
                                        return (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-gray-400 font-medium">
                                                    {log.createAt ? new Date(log.createAt).toLocaleString('ko-KR', {
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                        <span
                                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black w-fit ${config.bg} ${config.text}`}>
                                                            <i className={`ph-bold ${config.icon}`}></i> {config.label}
                                                        </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span
                                                            className="font-bold text-gray-800">{log.ingredientName}</span>
                                                        <span
                                                            className="text-[10px] text-gray-400">ID: {log.batchId || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 text-right font-black text-sm ${qtyColor}`}>
                                                    {log.changeQuantity && log.changeQuantity > 0 ? `+${log.changeQuantity}` : log.changeQuantity} EA
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-800">{log.balanceAfter ?? 0} EA</td>
                                                <td className="px-6 py-4 flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 uppercase">
                                                        {log.workerName?.substring(0, 1) || 'S'}
                                                    </div>
                                                    <span
                                                        className="font-medium text-gray-700">{log.workerName || '시스템'}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div
                            className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <span
                                className="text-[11px] font-bold text-gray-400 uppercase">검색 결과: {totalElements.toLocaleString()} 건</span>
                            {currentPage + 1 < totalPages && (
                                <button
                                    className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-2"
                                    onClick={() => fetchLogs(currentPage + 1)}
                                    disabled={loading}
                                >
                                    {loading ? '로딩 중...' : '+ 이전 기록 더보기'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StockLogPage;