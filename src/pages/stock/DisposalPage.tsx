import {useState, useEffect, useCallback, useRef} from "react";
import {
    getStoreStockSummary,
    getIngredientBatchDetails,
    getWasteRecords,
    recordWaste
} from "@/api/stock/stock";
import type {
    StockSummaryResponse,
    StockBatchResponse,
} from "@/types/stock/stock";
import type {
    DisposalResponse,
    DisposalSearchCondition,
    DisposalReason,
    DisposalItem
} from "@/types/stock/disposal";
import type {Pagination} from "@/types/common/common.ts";
import {requireStorePublicId} from "@/utils/store.ts";

// UI 표시용 사유 매핑
const REASON_MAP: Record<DisposalReason, { label: string; color: string }> = {
    EXPIRED: {label: "유통기한 경과", color: "red"},
    SPOILED: {label: "부패 및 변질", color: "orange"},
    DAMAGED: {label: "포장 파손", color: "gray"},
    OTHER: {label: "기타 사유", color: "gray"},
};

export default function DisposalPage() {
    const storePublicId = requireStorePublicId();

    // --- [1. 메인 내역 조회 상태] ---
    const [mainData, setMainData] = useState<Pagination<DisposalResponse> | null>(null);
    const [mainPage, setMainPage] = useState(0);
    const [isMainLoading, setIsMainLoading] = useState(false);
    const [mainCondition, setMainCondition] = useState<DisposalSearchCondition>({
        ingredientName: "",
        reason: undefined,
    });

    // --- [2. 등록 모달 및 폼 상태] ---
    const [isMainModalOpen, setIsMainModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

    type FormItem = DisposalItem & { ingredientName?: string };
    const [items, setItems] = useState<FormItem[]>([
        {stockBatchId: "", quantity: 0, reason: "EXPIRED", wasteDate: new Date().toISOString(), ingredientName: ""},
    ]);

    // --- [3. 재고 검색 모달용 상태 (무한 스크롤)] ---
    const [stockSearchTerm, setStockSearchTerm] = useState("");
    const [summaryItems, setSummaryItems] = useState<StockSummaryResponse[]>([]);
    const [summaryPage, setSummaryPage] = useState(0);
    const [hasMoreSummary, setHasMoreSummary] = useState(true);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    // 배치 선택용
    const [selectedIngredient, setSelectedIngredient] = useState<StockSummaryResponse | null>(null);
    const [batchItems, setBatchItems] = useState<StockBatchResponse[]>([]);
    const [isBatchLoading, setIsBatchLoading] = useState(false);

    // --- [4. API 호출 함수들] ---

    // A. 메인 폐기 내역 조회 (페이지네이션)
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

    // B. 재고 품목 요약 조회 (무한 스크롤)
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

    // C. 품목별 배치 조회
    const fetchBatches = async (ingredient: StockSummaryResponse) => {
        setSelectedIngredient(ingredient);
        setIsBatchLoading(true);
        try {
            const res = await getIngredientBatchDetails(storePublicId, ingredient.ingredientId);
            setBatchItems(res);
        } catch (error) {
            console.error("배치 조회 실패:", error);
        } finally {
            setIsBatchLoading(false);
        }
    };

    // --- [5. useEffect & Observer] ---

    // 메인 리스트 갱신
    useEffect(() => {
        fetchMainRecords();
    }, [mainPage, mainCondition, storePublicId]);

    // 재고 검색 모달 무한 스크롤 관찰자
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

    // --- [6. 핸들러 함수들] ---

    const handleRecordWaste = async () => {
        if (!items.every(i => i.stockBatchId && i.quantity > 0)) {
            alert("품목과 수량을 모두 확인해주세요.");
            return;
        }
        try {
            await recordWaste(storePublicId, {items: items.map(({ingredientName, ...rest}) => rest)});
            alert("폐기 등록 완료");
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

    // --- [핸들러 함수 추가] ---

    const handleSelectBatch = (batch: StockBatchResponse, ingredientName: string) => {
        if (activeItemIndex !== null) {
            // 1. 현재 수정 중인 폐기 항목(items[activeItemIndex])의 정보를 업데이트
            const newItems = [...items];
            newItems[activeItemIndex] = {
                ...newItems[activeItemIndex],
                stockBatchId: batch.stockBatchId.toString(),
                ingredientName: `${ingredientName} (${batch.expirationDate})`, // 화면에 표시될 이름 (유통기한 포함)
            };

            setItems(newItems);

            closeStockModal();
        }
    };

    return (
        <div className="flex flex-col space-y-6 p-6 bg-gray-50 min-h-screen">
            {/* 헤더 */}
            <div
                className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">폐기 관리</h1>
                    <p className="text-sm text-gray-400">재고 폐기 내역 조회 및 신규 등록</p>
                </div>
                <button onClick={() => setIsMainModalOpen(true)}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg">
                    새 폐기 등록
                </button>
            </div>

            {/* 메인 리스트 필터 */}
            <div className="bg-white p-4 rounded-2xl border flex gap-4">
                <input
                    type="text"
                    placeholder="품목명 검색..."
                    className="flex-1 max-w-sm px-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:bg-white"
                    onChange={(e) => setMainCondition(prev => ({...prev, ingredientName: e.target.value}))}
                />
            </div>

            {/* 메인 리스트 테이블 */}
            <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b font-bold text-gray-400">
                    <tr>
                        <th className="px-6 py-4">처리일자</th>
                        <th className="px-6 py-4">품목명</th>
                        <th className="px-6 py-4 text-right">수량</th>
                        <th className="px-6 py-4 text-right">손실액</th>
                        <th className="px-6 py-4 text-center">사유</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {isMainLoading ? (
                        <tr>
                            <td colSpan={5} className="text-center py-20 text-gray-400">로딩 중...</td>
                        </tr>
                    ) : mainData?.content.map((item) => (
                        <tr key={item.wastePublicId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-5">{new Date(item.wasteAt).toLocaleDateString()}</td>
                            <td className="px-6 py-5 font-black text-gray-800">{item.ingredientName}</td>
                            <td className="px-6 py-5 text-right font-bold">{item.quantity} EA</td>
                            <td className="px-6 py-5 text-right font-black text-red-500">₩{item.amount.toLocaleString()}</td>
                            <td className="px-6 py-5 text-center">
                                    <span
                                        className="px-2 py-1 bg-gray-100 rounded text-[10px] font-black text-gray-600">
                                        {REASON_MAP[item.reason]?.label}
                                    </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {/* 메인 페이지네이션 */}
                <div className="p-4 flex justify-end gap-2 bg-gray-50">
                    <button disabled={mainPage === 0} onClick={() => setMainPage(p => p - 1)}
                            className="p-2 border rounded bg-white disabled:opacity-50">이전
                    </button>
                    <button disabled={!mainData?.hasNext} onClick={() => setMainPage(p => p + 1)}
                            className="p-2 border rounded bg-white disabled:opacity-50">다음
                    </button>
                </div>
            </div>

            {/* [메인 모달] 폐기 등록 슬라이드 */}
            {isMainModalOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setIsMainModalOpen(false)}/>
                    <div className="fixed top-0 right-0 h-full w-[500px] bg-white z-[110] shadow-2xl flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-black text-gray-800">일괄 폐기 등록</h2>
                            <button onClick={() => setIsMainModalOpen(false)}><i className="ph ph-x text-2xl"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                            {items.map((item, index) => (
                                <div key={index}
                                     className="p-5 bg-white border rounded-2xl shadow-sm relative space-y-4">
                                    <button onClick={() => setItems(items.filter((_, i) => i !== index))}
                                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><i
                                        className="ph ph-trash"></i></button>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase">폐기 품목
                                            #{index + 1}</label>
                                        <div onClick={() => {
                                            setActiveItemIndex(index);
                                            setIsStockModalOpen(true);
                                        }}
                                             className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm flex justify-between items-center cursor-pointer hover:border-red-500">
                                            <span
                                                className={item.ingredientName ? "text-gray-800 font-bold" : "text-gray-400"}>
                                                {item.ingredientName || "재고에서 품목 선택"}
                                            </span>
                                            <i className="ph ph-magnifying-glass text-gray-400"></i>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="number" placeholder="수량"
                                               className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm"
                                               onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}/>
                                        <select className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm"
                                                onChange={(e) => updateItem(index, 'reason', e.target.value as DisposalReason)}>
                                            {Object.entries(REASON_MAP).map(([key, val]) => <option key={key}
                                                                                                    value={key}>{val.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setItems([...items, {
                                stockBatchId: "",
                                quantity: 0,
                                reason: "EXPIRED",
                                wasteDate: new Date().toISOString(),
                                ingredientName: ""
                            }])}
                                    className="w-full py-4 border-2 border-dashed rounded-2xl text-gray-400 font-bold hover:bg-white">+
                                항목 추가
                            </button>
                        </div>
                        <div className="p-6 border-t flex gap-3 bg-white">
                            <button onClick={() => setIsMainModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-100 rounded-xl font-bold">취소
                            </button>
                            <button onClick={handleRecordWaste}
                                    className="flex-[2] py-4 bg-red-600 text-white rounded-xl font-black shadow-lg">등록
                                완료
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* [서브 모달] 재고 검색 (무한스크롤 + 배치선택) */}
            {isStockModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeStockModal}/>
                    <div
                        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
                        <div className="p-6 border-b">
                            <div className="flex items-center gap-2">
                                {selectedIngredient && <button onClick={() => setSelectedIngredient(null)}
                                                               className="p-1 hover:bg-gray-100 rounded-full"><i
                                    className="ph ph-arrow-left text-xl"></i></button>}
                                <h3 className="text-xl font-black text-gray-800">{selectedIngredient ? "배치 선택" : "품목 검색"}</h3>
                            </div>
                            {!selectedIngredient && (
                                <div className="relative mt-4">
                                    <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                    <input type="text" placeholder="식재료 검색..."
                                           className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                                           value={stockSearchTerm} onChange={(e) => setStockSearchTerm(e.target.value)}
                                           autoFocus/>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {!selectedIngredient ? (
                                <div className="space-y-2">
                                    {summaryItems.map((item, idx) => (
                                        <div key={item.ingredientId}
                                             ref={summaryItems.length === idx + 1 ? lastItemRef : null}
                                             onClick={() => fetchBatches(item)}
                                             className="p-4 border rounded-2xl hover:border-red-500 hover:bg-red-50 cursor-pointer flex justify-between items-center group">
                                            <div>
                                                <div
                                                    className="font-black text-gray-800 group-hover:text-red-600">{item.ingredientName}</div>
                                                <div
                                                    className="text-[10px] text-gray-400 mt-1 font-bold">잔량: {item.totalRemainingQuantity} {item.unit} |
                                                    배치: {item.batchCount}개
                                                </div>
                                            </div>
                                            <i className="ph ph-caret-right text-gray-300"></i>
                                        </div>
                                    ))}
                                    {isSummaryLoading &&
                                        <div className="text-center py-4 text-xs text-gray-400">로드 중...</div>}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {isBatchLoading ?
                                        <div className="text-center py-10">불러오는 중...</div> : batchItems.map((batch) => (
                                            <div key={batch.stockBatchId}
                                                 onClick={() => handleSelectBatch(batch, selectedIngredient.ingredientName)}
                                                 className="p-4 border rounded-2xl hover:border-red-600 hover:bg-red-50 cursor-pointer">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div
                                                            className="font-bold text-gray-800 text-sm">{batch.rawProductName}</div>
                                                        <div
                                                            className="text-[10px] text-red-500 font-black mt-1">유통기한: {batch.expirationDate}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div
                                                            className="text-xs font-black text-gray-800">{batch.remainingQuantity} EA
                                                        </div>
                                                        <div className="text-[9px] text-gray-400 font-bold">잔량</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}