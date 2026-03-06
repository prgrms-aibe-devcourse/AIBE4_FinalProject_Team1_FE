import {useState, useEffect} from "react";
import type {
    DisposalItem,
    DisposalResponse,
    DisposalSearchCondition,
    DisposalReason,
    DisposalRequest
} from "@/types/disposal";
import {getWasteRecords, recordWaste} from "@/api/stock/stock.ts";
import type {DisposalPageResponse} from "@/types";
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
    // --- [상태 관리] ---
    const [isMainModalOpen, setIsMainModalOpen] = useState(false); // 등록 모달
    const [isStockModalOpen, setIsStockModalOpen] = useState(false); // 재고 검색 모달
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DisposalPageResponse<DisposalResponse> | null>(null);
    const [page, setPage] = useState(0);

    const [condition, setCondition] = useState<DisposalSearchCondition>({
        ingredientName: "",
        reason: undefined,
    });

    // 다이나믹 폼 상태 (UI용 ingredientName 필드 추가)
    type FormItem = DisposalItem & { ingredientName?: string };
    const [items, setItems] = useState<FormItem[]>([
        {stockBatchId: "", quantity: 0, reason: "EXPIRED", wasteDate: new Date().toISOString(), ingredientName: ""},
    ]);

    // --- [데이터 통신] ---
    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await getWasteRecords(storePublicId, condition, page, 20);
            setData(res);
        } catch (error) {
            console.error("조회 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [page, condition]);

    // --- [핸들러 함수] ---
    const handleSearchChange = (field: keyof DisposalSearchCondition, value: any) => {
        setPage(0);
        setCondition(prev => ({...prev, [field]: value}));
    };

    const addItem = () => {
        setItems([...items, {
            stockBatchId: "",
            quantity: 0,
            reason: "EXPIRED",
            wasteDate: new Date().toISOString(),
            ingredientName: ""
        }]);
    };

    const removeItem = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof FormItem, value: any) => {
        const newItems = [...items];
        newItems[index] = {...newItems[index], [field]: value};
        setItems(newItems);
    };

    // 재고 선택 핸들러
    const handleSelectStock = (stock: { stockBatchId: string, ingredientName: string }) => {
        if (activeItemIndex !== null) {
            updateItem(activeItemIndex, "stockBatchId", stock.stockBatchId);
            updateItem(activeItemIndex, "ingredientName", stock.ingredientName);
            setIsStockModalOpen(false);
            setActiveItemIndex(null);
        }
    };

    const handleRecordWaste = async () => {
        const isValid = items.every((item) => item.stockBatchId && item.quantity > 0);
        if (!isValid) {
            alert("모든 항목의 품목 선택과 수량을 확인해주세요.");
            return;
        }

        // 💡 DisposalRequest 타입에 맞춰 불필요한 필드 제거 후 전송
        const request: DisposalRequest = {
            items: items.map(({ingredientName, ...rest}) => rest)
        };

        try {
            await recordWaste(storePublicId, request);
            alert("폐기 등록이 완료되었습니다.");
            setItems([{
                stockBatchId: "",
                quantity: 0,
                reason: "EXPIRED",
                wasteDate: new Date().toISOString(),
                ingredientName: ""
            }]);
            setIsMainModalOpen(false);
            fetchRecords();
        } catch (error) {
            alert("등록 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="flex flex-col space-y-6 p-6 bg-gray-50 min-h-screen relative">

            {/* 1. 페이지 헤더 */}
            <div
                className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">폐기 관리</h1>
                    <p className="text-sm text-gray-400">재고 폐기 내역 조회 및 신규 등록</p>
                </div>
                <button
                    onClick={() => setIsMainModalOpen(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
                >
                    새 폐기 등록
                </button>
            </div>

            {/* 2. 필터 영역 */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex gap-4">
                <input
                    type="text"
                    placeholder="품목명 검색..."
                    value={condition.ingredientName || ""}
                    onChange={(e) => handleSearchChange("ingredientName", e.target.value)}
                    className="flex-1 max-w-sm px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white transition-all outline-none"
                />
                <select
                    value={condition.reason || ""}
                    onChange={(e) => handleSearchChange("reason", e.target.value || undefined)}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                >
                    <option value="">전체 사유</option>
                    {Object.entries(REASON_MAP).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>
            </div>

            {/* 3. 데이터 테이블 */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400">
                    <tr>
                        <th className="px-6 py-4">처리일자</th>
                        <th className="px-6 py-4">품목명</th>
                        <th className="px-6 py-4 text-right">수량</th>
                        <th className="px-6 py-4 text-right">손실액</th>
                        <th className="px-6 py-4 text-center">사유</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="text-center py-20 text-gray-400 font-bold">로딩 중...</td>
                        </tr>
                    ) : data?.content.map((item) => (
                        <tr key={item.wastePublicId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-5">{new Date(item.wasteAt).toLocaleDateString()}</td>
                            <td className="px-6 py-5 font-black text-gray-800">{item.ingredientName}</td>
                            <td className="px-6 py-5 text-right font-bold">{item.quantity} EA</td>
                            <td className="px-6 py-5 text-right font-black text-red-500">₩{item.amount.toLocaleString()}</td>
                            <td className="px-6 py-5 text-center">
                  <span
                      className={`px-2 py-1 rounded text-[10px] font-black ${item.reason === 'EXPIRED' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    {REASON_MAP[item.reason]?.label}
                  </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {/* 페이지네이션 생략 (이전 코드와 동일) */}
            </div>

            {/* 4. [메인 모달] 폐기 등록 슬라이드 */}
            {isMainModalOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setIsMainModalOpen(false)}/>
                    <div
                        className="fixed top-0 right-0 h-full w-[500px] bg-white z-[110] shadow-2xl flex flex-col transition-transform">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-black text-gray-800">일괄 폐기 등록</h2>
                            <button onClick={() => setIsMainModalOpen(false)}><i className="ph ph-x text-2xl"></i>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                            {items.map((item, index) => (
                                <div key={index}
                                     className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm relative space-y-4">
                                    <button onClick={() => removeItem(index)}
                                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><i
                                        className="ph ph-trash text-lg"></i></button>

                                    {/* 품목 선택 버튼 */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase">폐기 품목
                                            #{index + 1}</label>
                                        <div
                                            onClick={() => {
                                                setActiveItemIndex(index);
                                                setIsStockModalOpen(true);
                                            }}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm flex justify-between items-center cursor-pointer hover:border-red-500 transition-all"
                                        >
                      <span className={item.ingredientName ? "text-gray-800 font-bold" : "text-gray-400"}>
                        {item.ingredientName || "재고에서 품목을 선택하세요"}
                      </span>
                                            <i className="ph ph-magnifying-glass text-gray-400"></i>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-gray-400">폐기 수량</label>
                                            <input
                                                type="number"
                                                value={item.quantity || ""}
                                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-gray-400">폐기 사유</label>
                                            <select
                                                value={item.reason}
                                                onChange={(e) => updateItem(index, 'reason', e.target.value as DisposalReason)}
                                                className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none cursor-pointer"
                                            >
                                                {Object.entries(REASON_MAP).map(([key, val]) => (
                                                    <option key={key} value={key}>{val.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addItem}
                                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:bg-white hover:border-red-200 hover:text-red-500 transition-all">+
                                폐기 항목 추가
                            </button>
                        </div>

                        <div className="p-6 border-t flex gap-3 bg-white">
                            <button onClick={() => setIsMainModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-100 rounded-xl font-bold">취소
                            </button>
                            <button onClick={handleRecordWaste}
                                    className="flex-[2] py-4 bg-red-600 text-white rounded-xl font-black shadow-lg shadow-red-100">
                                {items.length}건 폐기 등록
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* 5. [서브 모달] 재고 검색 */}
            {isStockModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                         onClick={() => setIsStockModalOpen(false)}/>
                    <div
                        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-black text-gray-800">재고 선택</h3>
                            <div className="relative mt-4">
                                <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input
                                    type="text"
                                    placeholder="식재료명 또는 바코드로 검색..."
                                    className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {/* 임시 데이터 렌더링 - 실제로는 API 결과 매핑 */}
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleSelectStock({
                                        stockBatchId: `uuid-test-${i}`,
                                        ingredientName: `서울우유 1000ml (Batch ${i})`
                                    })}
                                    className="p-4 border border-gray-100 rounded-2xl hover:border-red-500 hover:bg-red-50 cursor-pointer transition-all flex justify-between items-center group"
                                >
                                    <div>
                                        <div className="font-black text-gray-800 group-hover:text-red-600">서울우유 1000ml
                                            (Batch {i})
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 font-bold">잔여: 24 EA | 유통기한:
                                            2026-03-10
                                        </div>
                                    </div>
                                    <i className="ph ph-caret-right text-gray-300 group-hover:text-red-500"></i>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}