import {useState, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import {getStoreStockSummary, getIngredientBatchDetails} from "@/api/stock/stock";
import type {StockSummaryResponse, StockSearchCondition, StockBatchResponse} from "@/types/stock/stock";
import {requireStorePublicId} from "@/utils/store.ts";

export default function StockPage() {
    const navigate = useNavigate();
    const storePublicId = requireStorePublicId();

    const [items, setItems] = useState<StockSummaryResponse[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const [selectedItem, setSelectedItem] = useState<StockSummaryResponse | null>(null);
    const [batches, setBatches] = useState<StockBatchResponse[]>([]);
    const [batchLoading, setBatchLoading] = useState(false);

    const [condition, setCondition] = useState<StockSearchCondition>({
        ingredientName: '',
        includeZeroStock: true
    });

    const fetchStockData = async (targetPage: number) => {
        if (!storePublicId) return;
        setLoading(true);
        try {
            const response = await getStoreStockSummary(storePublicId, condition, targetPage, 15);
            setItems(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            setPage(response.page);
        } catch (error) {
            console.error("재고 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = async (item: StockSummaryResponse) => {
        if (selectedItem?.ingredientId === item.ingredientId) {
            setSelectedItem(null);
            setBatches([]);
            return;
        }
        setSelectedItem(item);
        setBatchLoading(true);
        try {
            const data = await getIngredientBatchDetails(storePublicId, item.ingredientId);
            setBatches(data);
        } catch (error) {
            setBatches([]);
        } finally {
            setBatchLoading(false);
        }
    };

    useEffect(() => {
        fetchStockData(0);
        setSelectedItem(null);
    }, [condition.ingredientName, condition.includeZeroStock, storePublicId]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            fetchStockData(newPage);
            setSelectedItem(null);
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto w-full max-w-6xl px-6 py-8">
                {/* 상단 헤더: 입고 페이지와 동일한 스타일 */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">재고 현황</h1>
                        <p className="mt-3 text-sm text-gray-500">
                            매장의 전체 재고를 확인하고 유통기한별 상세 배치를 관리하세요.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchStockData(page)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-800 hover:bg-gray-50"
                        >
                            새로고침
                        </button>
                        <button
                            onClick={() => navigate(`/stock/${storePublicId}/disposal`)}
                            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white hover:bg-gray-900 transition"
                        >
                            폐기 관리 이동
                        </button>
                    </div>
                </div>

                {/* 검색 및 필터 바 */}
                <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="품목명으로 검색..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:border-black outline-none transition-all"
                            onChange={(e) => setCondition(prev => ({...prev, ingredientName: e.target.value}))}
                        />
                    </div>
                    <button
                        onClick={() => setCondition(prev => ({...prev, includeZeroStock: !prev.includeZeroStock}))}
                        className={`rounded-xl px-4 py-2.5 text-xs font-black border transition ${condition.includeZeroStock
                            ? "border-black bg-black text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        품절 포함 {condition.includeZeroStock ? 'ON' : 'OFF'}
                    </button>
                </div>

                {/* 메인 리스트: 입고 페이지 리스트 스타일 계승 */}
                <div className="mt-4 space-y-3">
                    {loading ? (
                        <div
                            className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-400 font-bold animate-pulse">
                            데이터 로드 중...
                        </div>
                    ) : items.length === 0 ? (
                        <div
                            className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-400 font-bold">
                            재고 데이터가 없습니다.
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.ingredientId}
                                onClick={() => handleRowClick(item)}
                                className={`cursor-pointer rounded-2xl border p-5 transition ${
                                    selectedItem?.ingredientId === item.ingredientId
                                        ? "border-black bg-gray-50 shadow-sm"
                                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="text-sm font-black text-gray-900">{item.ingredientName}</div>
                                            <span
                                                className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gray-100 text-gray-600 border border-gray-200">
                                                {item.batchCount} BATCHES
                                            </span>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                            ID: <span className="font-mono">{item.ingredientId}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-gray-400 uppercase">Total
                                                Stock
                                            </div>
                                            <div className="text-sm font-black text-gray-900">
                                                {item.totalRemainingQuantity.toLocaleString()} <span
                                                className="text-[10px] text-gray-500">{item.unit}</span>
                                            </div>
                                        </div>
                                        <div className="text-right min-w-[100px]">
                                            <div className="text-[10px] font-black text-gray-400 uppercase">Exp.
                                                Closest
                                            </div>
                                            <div
                                                className={`text-sm font-black ${item.minExpirationDate ? 'text-red-600' : 'text-gray-300'}`}>
                                                {item.minExpirationDate || '-'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/stock/${storePublicId}/disposal?id=${item.ingredientId}`);
                                            }}
                                            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-black text-gray-700 hover:bg-gray-50 transition"
                                        >
                                            폐기 관리
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 페이지네이션 */}
                <div className="mt-6 flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-400">
                        PAGE {page + 1} OF {totalPages} · TOTAL {totalElements}
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 0}
                            onClick={() => handlePageChange(page - 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-30"
                        >
                            <i className="ph ph-caret-left"></i>
                        </button>
                        <button
                            disabled={page === totalPages - 1}
                            onClick={() => handlePageChange(page + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-30"
                        >
                            <i className="ph ph-caret-right"></i>
                        </button>
                    </div>
                </div>

                {/* --- 상세 배치 현황: 카드 스타일 --- */}
                {selectedItem && (
                    <div
                        className="mt-10 pt-8 border-t border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span
                                    className="px-2 py-1 rounded-lg bg-black text-white text-[10px] font-black uppercase">Detail</span>
                                <h2 className="text-xl font-black text-gray-900">{selectedItem.ingredientName} 배치
                                    내역</h2>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-900">
                                <i className="ph ph-x text-2xl"></i>
                            </button>
                        </div>

                        {batchLoading ? (
                            <div className="p-10 text-center text-gray-400 font-bold">로딩 중...</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {batches.map((batch) => (
                                    <div key={batch.stockBatchId}
                                         className="rounded-2xl border border-gray-200 bg-white p-5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div
                                                    className="text-[10px] font-black text-gray-400 uppercase">Expiration
                                                    Date
                                                </div>
                                                <div
                                                    className="text-sm font-black text-red-600">{batch.expirationDate}</div>
                                                <div
                                                    className="mt-2 text-[10px] text-gray-400 font-medium">{batch.rawProductName}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-gray-400 uppercase">Stock
                                                </div>
                                                <div
                                                    className="text-lg font-black text-gray-900">{batch.remainingQuantity}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}