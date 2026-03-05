import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardCheck,
    Save,
    CheckCircle,
    Search,
    AlertCircle,
    History,
    ArrowLeftRight,
} from 'lucide-react';
import { requireStorePublicId } from '@/utils/store.ts';
import { getIngredients } from '@/api/ingredient.ts';
import { createStockTakeSheet, confirmStockTakeSheet } from '@/api/stockTake.ts';
import type { StockTakeItemRequest } from '@/types/stockTake.ts';

/**
 * 실사 재고 관리 메인 컴포넌트
 */
const StocktakePage: React.FC = () => {
    const navigate = useNavigate();
    // --- 상태 관리 ---
    const storePublicId = requireStorePublicId();
    const [title, setTitle] = useState(`${new Date().toLocaleDateString()} 정기 재고 실사`);
    const [items, setItems] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [sheetPublicId, setSheetPublicId] = useState<string | null>(null);
    const [status, setStatus] = useState("DRAFT"); // DRAFT, SAVED, CONFIRMED

    // --- 데이터 로드 ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 식재료 목록 조회
                const ingredients = await getIngredients(storePublicId);

                // 로컬 저장소 확인
                const savedData = localStorage.getItem(`stocktake_draft_${storePublicId}`);
                let savedItemsMap = new Map();

                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    setTitle(parsed.title);
                    if (parsed.sheetPublicId) setSheetPublicId(parsed.sheetPublicId);
                    if (parsed.items) {
                        parsed.items.forEach((item: any) => {
                            savedItemsMap.set(item.ingredientPublicId, item.stocktakeQty);
                        });
                    }
                }

                // API 데이터와 로컬 데이터 병합
                const mergedItems = ingredients.map(ing => ({
                    ingredientPublicId: ing.ingredientPublicId,
                    name: ing.name,
                    unit: ing.unit,
                    theoreticalQty: 0, // 현재 API에서 제공되지 않음 (추후 보완)
                    stocktakeQty: savedItemsMap.get(ing.ingredientPublicId) || ""
                }));

                setItems(mergedItems);
            } catch (error) {
                console.error("데이터 로드 실패:", error);
                alert("재료 정보를 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [storePublicId]);

    // --- 데이터 변경 시 로컬 자동 저장 ---
    useEffect(() => {
        if (status !== "CONFIRMED" && items.length > 0) {
            const dataToSave = { title, items, sheetPublicId };
            localStorage.setItem(`stocktake_draft_${storePublicId}`, JSON.stringify(dataToSave));
        }
    }, [title, items, sheetPublicId, status, storePublicId]);

    // --- 비즈니스 로직 ---

    // 실시간 차이(Variance) 계산 리스트
    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    // 수량 입력 핸들러
    const handleQtyChange = (ingredientPublicId: string, value: string) => {
        if (status === "CONFIRMED") return;
        setItems(prev => prev.map(item =>
            item.ingredientPublicId === ingredientPublicId ? { ...item, stocktakeQty: value } : item
        ));
        setStatus("DRAFT");
    };

    // [POST] 임시 저장 (createStockTakeSheet 연동)
    const saveDraft = async () => {
        if (items.filter(i => i.stocktakeQty !== "").length === 0) {
            alert("실사 수량을 하나 이상 입력해주세요.");
            return;
        }

        setIsSaving(true);
        try {
            const requestItems: StockTakeItemRequest[] = items
                .filter(i => i.stocktakeQty !== "")
                .map(i => ({
                    ingredientPublicId: i.ingredientPublicId,
                    stockTakeQty: parseFloat(i.stocktakeQty as string)
                }));

            const requestBody = {
                title: title,
                items: requestItems
            };

            const newSheetId = await createStockTakeSheet(storePublicId, requestBody);
            setSheetPublicId(newSheetId);
            setStatus("SAVED");
            alert("임시 저장이 완료되었습니다.");
        } catch (error) {
            console.error("저장 실패:", error);
            alert("저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    // [POST] 전표 확정 (confirmStockTakeSheet 연동)
    const confirmStocktake = async () => {
        let currentSheetId = sheetPublicId;

        // 시트 ID가 없으면 먼저 저장 시도
        if (!currentSheetId) {
            if (window.confirm("확정 전 임시 저장이 필요합니다. 저장하시겠습니까?")) {
                await saveDraft();
                // saveDraft가 성공하면 state가 업데이트되지만, 클로저 문제로 인해 직접 가져오거나 로직 개선 필요
                // 여기선 단순화를 위해 재확인 프로세스 사용
                return;
            } else {
                return;
            }
        }

        if (!window.confirm("재고 실사를 확정하시겠습니까? 확정 후에는 실제 재고량이 조정되며 수정할 수 없습니다.")) return;

        setIsConfirming(true);
        try {
            await confirmStockTakeSheet(storePublicId, currentSheetId);
            setStatus("CONFIRMED");
            localStorage.removeItem(`stocktake_draft_${storePublicId}`);
            alert("재고 실사가 성공적으로 확정되어 장부가 업데이트되었습니다.");
        } catch (error) {
            console.error("확정 실패:", error);
            alert("확정 처리에 실패했습니다.");
        } finally {
            setIsConfirming(false);
        }
    };


    // 요약 정보 계산
    const summary = useMemo(() => {
        const entered = items.filter(i => i.stocktakeQty !== "").length;
        const totalVariance = items.reduce((acc, curr) => {
            if (curr.stocktakeQty === "") return acc;
            return acc + (parseFloat(curr.stocktakeQty as string) - curr.theoreticalQty);
        }, 0);
        return { entered, total: items.length, variance: totalVariance };
    }, [items]);

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* 상단 액션 바 */}
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-6 py-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/inventory/stocktakes")}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
                            title="목록으로"
                        >
                            <ArrowLeftRight size={20} />
                        </button>
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                            <ClipboardCheck size={24} />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={status === "CONFIRMED"}
                                className="text-xl font-bold text-slate-800 bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none transition-all"
                                placeholder="전표 제목 입력"
                            />
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${status === "CONFIRMED" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                    }`}>
                                    {status === "CONFIRMED" ? "확정됨" : "작성 중"}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">ID: {storePublicId.substring(0, 8)}...</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={saveDraft}
                            disabled={isSaving || status === "CONFIRMED"}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50 transition"
                        >
                            <Save size={18} className={isSaving ? "animate-spin" : ""} />
                            {isSaving ? "저장 중..." : "임시저장"}
                        </button>
                        <button
                            onClick={confirmStocktake}
                            disabled={isConfirming || status === "CONFIRMED"}
                            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-100 disabled:bg-slate-300 disabled:shadow-none transition"
                        >
                            <CheckCircle size={18} />
                            {isConfirming ? "확정 처리 중..." : "최종 확정"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto mt-6 px-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                        <p className="text-slate-500 font-medium">재료 정보를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <>
                        {/* 요약 대시보드 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">진행률</p>
                                    <h3 className="text-2xl font-black text-slate-700">{summary.entered} / {summary.total}</h3>
                                </div>
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                    <History size={20} />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">전체 차이 수량</p>
                                    <h3 className={`text-2xl font-black ${summary.variance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {summary.variance > 0 ? `+${summary.variance.toFixed(2)}` : summary.variance.toFixed(2)}
                                    </h3>
                                </div>
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                    <ArrowLeftRight size={20} />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Search size={16} className="text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="식재료 검색..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-transparent focus:outline-none text-sm text-slate-600"
                                    />
                                </div>
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${(summary.entered / summary.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 메인 리스트 테이블 */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">식재료 정보</th>
                                        <th className="px-6 py-4 text-right">전산 재고 (A)</th>
                                        <th className="px-6 py-4 text-center w-48">실사 수량 (B)</th>
                                        <th className="px-6 py-4 text-right">차이 (B-A)</th>
                                        <th className="px-6 py-4 text-center">단위</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.length > 0 ? filteredItems.map((item) => {
                                        const variance = item.stocktakeQty !== "" ? (parseFloat(item.stocktakeQty as string) - item.theoreticalQty) : 0;
                                        const isDirty = item.stocktakeQty !== "";

                                        return (
                                            <tr key={item.ingredientPublicId} className={`hover:bg-slate-50 transition-colors ${status === "CONFIRMED" ? "opacity-75" : ""}`}>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{item.name}</div>
                                                    <div className="text-xs text-slate-400">코드: {item.ingredientPublicId}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-slate-500">
                                                    {item.theoreticalQty.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled={status === "CONFIRMED"}
                                                            value={item.stocktakeQty}
                                                            onChange={(e) => handleQtyChange(item.ingredientPublicId, e.target.value)}
                                                            className={`w-full p-2.5 text-center font-black rounded-lg border-2 transition-all outline-none ${isDirty
                                                                ? "border-emerald-200 bg-emerald-50 text-emerald-900 focus:border-emerald-500"
                                                                : "border-slate-200 bg-white focus:border-slate-400"
                                                                } ${status === "CONFIRMED" ? "bg-slate-100 border-slate-100" : ""}`}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold text-sm ${!isDirty ? "text-slate-300" : variance > 0 ? "text-blue-600" : variance < 0 ? "text-red-600" : "text-slate-400"
                                                    }`}>
                                                    {isDirty ? (variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)) : "0.00"}
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">
                                                    {item.unit}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                                                검색 결과와 일치하는 식재료가 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 하단 안내사항 */}
                        <div className="mt-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-slate-400 font-medium">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> 재고 부족 (손실)</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 재고 과잉 (조정)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <AlertCircle size={14} />
                                최종 확정 시 장부 재고가 실사 수량으로 강제 업데이트됩니다.
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* 모바일 하단 플로팅 정보 바 */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-20 md:hidden">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">입력됨</span>
                    <span className="font-bold">{summary.entered}</span>
                </div>
                <div className="w-px h-6 bg-slate-600"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">총 차이</span>
                    <span className={`font-bold ${summary.variance >= 0 ? "text-blue-400" : "text-red-400"}`}>
                        {summary.variance.toFixed(1)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StocktakePage;
