import {useState, useEffect, useCallback, useRef} from "react";
import {
    getStoreStockSummary,
    getIngredientBatchDetails,
    getWasteRecords,
    recordWaste
} from "@/api/stock/stock";
import type {StockSummaryResponse, StockBatchResponse} from "@/types/stock/stock";
import type {DisposalResponse, DisposalSearchCondition, DisposalReason, DisposalItem} from "@/types/stock/disposal";
import type {PageResponse} from "@/types/common/common.ts";
import {requireStorePublicId} from "@/utils/store.ts";

const REASON_MAP: Record<DisposalReason, { label: string }> = {
    EXPIRED: {label: "유통기한 경과"},
    SPOILED: {label: "부패 및 변질"},
    DAMAGED: {label: "포장 파손"},
    OTHER: {label: "기타 사유"},
};

export default function DisposalPage() {
    const storePublicId = requireStorePublicId();

    const [mainData, setMainData] = useState<PageResponse<DisposalResponse> | null>(null);
    const [mainPage, setMainPage] = useState(0);
    const [isMainLoading, setIsMainLoading] = useState(false);
    const [mainCondition, setMainCondition] = useState<DisposalSearchCondition>({
        ingredientName: "",
        reason: undefined,
    });

    const [isMainModalOpen, setIsMainModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

    type FormItem = DisposalItem & { ingredientName?: string };
    const [items, setItems] = useState<FormItem[]>([
        {stockBatchId: "", quantity: 0, reason: "EXPIRED", wasteDate: new Date().toISOString(), ingredientName: ""},
    ]);

    const [stockSearchTerm, setStockSearchTerm] = useState("");
    const [summaryItems, setSummaryItems] = useState<StockSummaryResponse[]>([]);
    const [summaryPage, setSummaryPage] = useState(0);
    const [hasMoreSummary, setHasMoreSummary] = useState(true);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    const [selectedIngredient, setSelectedIngredient] = useState<StockSummaryResponse | null>(null);
    const [batchItems, setBatchItems] = useState<StockBatchResponse[]>([]);
    const [isBatchLoading, setIsBatchLoading] = useState(false);

    const fetchMainRecords = async () => {
        setIsMainLoading(true);
        try {
            const res = await getWasteRecords(storePublicId, mainCondition, mainPage, 15);
            setMainData(res);
        } catch (error) {
            console.error("내역 조회 실패:", error);
        } finally {
            setIsMainLoading(false);
        }
    };

    const fetchStockSummaries = useCallback(async (isInitial: boolean) => {
        setIsSummaryLoading(true);
        try {
            const pageToFetch = isInitial ? 0 : summaryPage;
            const res = await getStoreStockSummary(storePublicId, {
                ingredientName: stockSearchTerm,
                includeZeroStock: false
            }, pageToFetch, 10);
            setSummaryItems(prev => isInitial ? res.content : [...prev, ...res.content]);
            setHasMoreSummary(res.hasNext);
        } catch (error) {
            console.error("재고 검색 실패:", error);
        } finally {
            setIsSummaryLoading(false);
        }
    }, [storePublicId, stockSearchTerm, summaryPage]);

    const fetchBatches = async (ingredient: StockSummaryResponse) => {
        setSelectedIngredient(ingredient);
        setIsBatchLoading(true);
        try {
            const res = await getIngredientBatchDetails(storePublicId, ingredient.ingredientId);
            setBatchItems(res);
        } finally {
            setIsBatchLoading(false);
        }
    };

    useEffect(() => {
        fetchMainRecords();
    }, [mainPage, mainCondition, storePublicId]);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastItemRef = useCallback((node: HTMLDivElement) => {
        if (isSummaryLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreSummary) setSummaryPage(prev => prev + 1);
        });
        if (node) observer.current.observe(node);
    }, [isSummaryLoading, hasMoreSummary]);

    useEffect(() => {
        if (isStockModalOpen) {
            setSummaryPage(0);
            fetchStockSummaries(true);
        }
    }, [stockSearchTerm, isStockModalOpen]);

    useEffect(() => {
        if (summaryPage > 0) fetchStockSummaries(false);
    }, [summaryPage]);

    const handleRecordWaste = async () => {
        if (!items.every(i => i.stockBatchId && i.quantity > 0)) {
            alert("품목과 수량을 모두 확인해주세요.");
            return;
        }
        try {
            await recordWaste(storePublicId, {items: items.map(({ingredientName, ...rest}) => rest)});
            setIsMainModalOpen(false);
            setItems([{
                stockBatchId: "",
                quantity: 0,
                reason: "EXPIRED",
                wasteDate: new Date().toISOString(),
                ingredientName: ""
            }]);
            fetchMainRecords();
        } catch (error) {
            alert("등록 실패");
        }
    };

    const updateItem = (index: number, field: keyof FormItem, value: any) => {
        const newItems = [...items];
        newItems[index] = {...newItems[index], [field]: value};
        setItems(newItems);
    };

    const closeStockModal = () => {
        setIsStockModalOpen(false);
        setStockSearchTerm("");
        setSelectedIngredient(null);
        setBatchItems([]);
    };

    const handleSelectBatch = (batch: StockBatchResponse, ingredientName: string) => {
        if (activeItemIndex !== null) {
            const newItems = [...items];
            newItems[activeItemIndex] = {
                ...newItems[activeItemIndex],
                stockBatchId: batch.stockBatchId.toString(),
                ingredientName: `${ingredientName} (${batch.expirationDate})`,
            };
            setItems(newItems);
            closeStockModal();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto w-full max-w-6xl px-6 py-8">
                {/* 상단 헤더: 통일된 스타일 */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">폐기 관리</h1>
                        <p className="mt-1 text-sm text-gray-500">품목별 폐기 내역을 조회하고 새로운 폐기 내역을 등록하세요.</p>
                    </div>
                    <button
                        onClick={() => setIsMainModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white hover:bg-gray-900 transition shadow-sm"
                    >
                        새 폐기 등록
                    </button>
                </div>

                {/* 필터 영역 */}
                <div className="mt-6 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="품목명 검색..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:border-black outline-none transition-all"
                            onChange={(e) => setMainCondition(prev => ({...prev, ingredientName: e.target.value}))}
                        />
                    </div>
                </div>

                {/* 메인 리스트: 카드형 테이블 스타일 */}
                <div
                    className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-gray-400 font-black uppercase tracking-wider">
                                <th className="px-6 py-4">처리일자</th>
                                <th className="px-6 py-4">품목 정보</th>
                                <th className="px-6 py-4 text-right">수량</th>
                                <th className="px-6 py-4 text-right">손실액</th>
                                <th className="px-6 py-4 text-center">사유</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {isMainLoading ? (
                                <tr>
                                    <td colSpan={5}
                                        className="py-20 text-center text-gray-400 font-bold animate-pulse">데이터 로드 중...
                                    </td>
                                </tr>
                            ) : mainData?.content.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-gray-400 font-bold">폐기 내역이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                mainData?.content.map((item) => (
                                    <tr key={item.wastePublicId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-5 text-gray-400 font-medium whitespace-nowrap">
                                            {new Date(item.wasteAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-5 font-black text-gray-900">{item.ingredientName}</td>
                                        <td className="px-6 py-5 text-right font-black text-sm">{item.quantity} EA</td>
                                        <td className="px-6 py-5 text-right font-black text-red-600">
                                            - ₩{item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                                <span
                                                    className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-black bg-gray-100 text-gray-600 border border-gray-200">
                                                    {REASON_MAP[item.reason]?.label}
                                                </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                    {/* 페이지네이션 */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Page {mainPage + 1} of {mainData?.totalPages || 1}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={mainPage === 0}
                                onClick={() => setMainPage(p => p - 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-30"
                            >
                                <i className="ph ph-caret-left font-bold"></i>
                            </button>
                            <button
                                disabled={!mainData?.hasNext}
                                onClick={() => setMainPage(p => p + 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-30"
                            >
                                <i className="ph ph-caret-right font-bold"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* [메인 모달] 폐기 등록 우측 슬라이드: 블랙 테마 적용 */}
            {isMainModalOpen && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity"
                         onClick={() => setIsMainModalOpen(false)}/>
                    <div
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-black text-gray-900">폐기 등록</h2>
                            <button onClick={() => setIsMainModalOpen(false)}
                                    className="text-gray-400 hover:text-black">
                                <i className="ph ph-x text-2xl"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                            {items.map((item, index) => (
                                <div key={index}
                                     className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm relative space-y-4">
                                    <button
                                        onClick={() => setItems(items.filter((_, i) => i !== index))}
                                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <i className="ph ph-trash-simple text-lg"></i>
                                    </button>
                                    <div className="space-y-1.5">
                                        <label
                                            className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">품목
                                            선택</label>
                                        <div
                                            onClick={() => {
                                                setActiveItemIndex(index);
                                                setIsStockModalOpen(true);
                                            }}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm flex justify-between items-center cursor-pointer hover:border-black transition-all"
                                        >
                                            <span
                                                className={item.ingredientName ? "text-gray-900 font-black" : "text-gray-400 font-bold"}>
                                                {item.ingredientName || "재고 품목 찾기"}
                                            </span>
                                            <i className="ph ph-magnifying-glass text-gray-400"></i>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">수량</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black focus:bg-white focus:border-black outline-none"
                                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">폐기
                                                사유</label>
                                            <select
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black focus:bg-white focus:border-black outline-none appearance-none"
                                                onChange={(e) => updateItem(index, 'reason', e.target.value as DisposalReason)}
                                            >
                                                {Object.entries(REASON_MAP).map(([key, val]) => <option key={key}
                                                                                                        value={key}>{val.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setItems([...items, {
                                    stockBatchId: "",
                                    quantity: 0,
                                    reason: "EXPIRED",
                                    wasteDate: new Date().toISOString(),
                                    ingredientName: ""
                                }])}
                                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-black hover:bg-white hover:border-gray-300 transition-all"
                            >
                                + 추가 항목
                            </button>
                        </div>
                        <div className="p-6 border-t bg-white flex gap-3">
                            <button onClick={() => setIsMainModalOpen(false)}
                                    className="flex-1 py-3.5 bg-gray-100 rounded-xl text-sm font-black text-gray-600">취소
                            </button>
                            <button onClick={handleRecordWaste}
                                    className="flex-[2] py-3.5 bg-black text-white rounded-xl text-sm font-black shadow-lg">폐기
                                등록 확정
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* [서브 모달] 재고 품목 검색: 깔끔한 대화상자 스타일 */}
            {isStockModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeStockModal}/>
                    <div
                        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col h-[550px] overflow-hidden">
                        <div className="p-6 border-b">
                            <div className="flex items-center gap-3">
                                {selectedIngredient && (
                                    <button onClick={() => setSelectedIngredient(null)}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                        <i className="ph ph-arrow-left text-xl"></i>
                                    </button>
                                )}
                                <h3 className="text-xl font-black text-gray-900">{selectedIngredient ? "배치 선택" : "품목 검색"}</h3>
                            </div>
                            {!selectedIngredient && (
                                <div className="relative mt-4">
                                    <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                    <input
                                        type="text"
                                        placeholder="재고 품목명 입력..."
                                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black focus:bg-white focus:border-black outline-none transition-all"
                                        value={stockSearchTerm}
                                        onChange={(e) => setStockSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {!selectedIngredient ? (
                                summaryItems.map((item, idx) => (
                                    <div
                                        key={item.ingredientId}
                                        ref={summaryItems.length === idx + 1 ? lastItemRef : null}
                                        onClick={() => fetchBatches(item)}
                                        className="p-4 border border-gray-100 rounded-2xl hover:border-black hover:bg-gray-50 cursor-pointer flex justify-between items-center group transition-all"
                                    >
                                        <div>
                                            <div className="font-black text-gray-900">{item.ingredientName}</div>
                                            <div className="text-[10px] text-gray-400 mt-1 font-bold uppercase">
                                                Stock: {item.totalRemainingQuantity} {item.unit} · {item.batchCount} Batch
                                            </div>
                                        </div>
                                        <i className="ph ph-caret-right text-gray-300 group-hover:text-black"></i>
                                    </div>
                                ))
                            ) : (
                                batchItems.map((batch) => (
                                    <div
                                        key={batch.stockBatchId}
                                        onClick={() => handleSelectBatch(batch, selectedIngredient.ingredientName)}
                                        className="p-4 border border-gray-100 rounded-2xl hover:border-black hover:bg-gray-50 cursor-pointer transition-all"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div
                                                    className="text-[10px] font-black text-red-600 uppercase">Exp. {batch.expirationDate}</div>
                                                <div
                                                    className="text-sm font-black text-gray-900 mt-0.5">{batch.rawProductName}</div>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className="text-sm font-black text-gray-900">{batch.remainingQuantity} EA
                                                </div>
                                                <div
                                                    className="text-[9px] font-bold text-gray-400 uppercase">Available
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {(isSummaryLoading || isBatchLoading) &&
                                <div className="py-10 text-center text-xs font-bold text-gray-400 animate-pulse">데이터 로딩
                                    중...</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}