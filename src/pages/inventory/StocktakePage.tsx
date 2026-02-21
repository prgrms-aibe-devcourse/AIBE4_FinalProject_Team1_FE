import React, { useState, useEffect, useMemo } from 'react';
import {
    ClipboardCheck,
    Save,
    CheckCircle,
    Search,
    AlertCircle,
    History,
    ArrowLeftRight,
} from 'lucide-react';

/**
 * 실사 재고 관리 메인 컴포넌트
 */
const StocktakePage: React.FC = () => {
    // --- 상태 관리 ---
    const [storePublicId] = useState("b58e82a3-764c-4740-9b4e-8f199b1c1234"); // 실제 환경에선 URL 파라미터 등에서 추출
    const [title, setTitle] = useState(`${new Date().toLocaleDateString()} 정기 재고 실사`);
    const [items, setItems] = useState([
        { ingredientId: 101, name: "에스프레소 원두(A)", unit: "kg", theoreticalQty: 12.50, stocktakeQty: "" },
        { ingredientId: 102, name: "멸균우유 (1L)", unit: "개", theoreticalQty: 48.00, stocktakeQty: "" },
        { ingredientId: 103, name: "바닐라 시럽", unit: "병", theoreticalQty: 6.00, stocktakeQty: "" },
        { ingredientId: 104, name: "초코 파우더", unit: "kg", theoreticalQty: 3.25, stocktakeQty: "" },
        { ingredientId: 105, name: "종이컵 (12oz)", unit: "박스", theoreticalQty: 2.00, stocktakeQty: "" },
    ]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [sheetId, setSheetId] = useState<number | null>(null);
    const [status, setStatus] = useState("DRAFT"); // DRAFT, SAVED, CONFIRMED

    // --- 로컬 저장소 자동 로드 ---
    useEffect(() => {
        const savedData = localStorage.getItem(`stocktake_draft_${storePublicId}`);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setTitle(parsed.title);
            setItems(parsed.items);
            if (parsed.sheetId) setSheetId(parsed.sheetId);
        }
    }, [storePublicId]);

    // --- 데이터 변경 시 로컬 자동 저장 ---
    useEffect(() => {
        if (status !== "CONFIRMED") {
            const dataToSave = { title, items, sheetId };
            localStorage.setItem(`stocktake_draft_${storePublicId}`, JSON.stringify(dataToSave));
        }
    }, [title, items, sheetId, status, storePublicId]);

    // --- 비즈니스 로직 ---

    // 실시간 차이(Variance) 계산 리스트
    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    // 수량 입력 핸들러
    const handleQtyChange = (ingredientId: number, value: string) => {
        if (status === "CONFIRMED") return;
        setItems(prev => prev.map(item =>
            item.ingredientId === ingredientId ? { ...item, stocktakeQty: value } : item
        ));
        setStatus("DRAFT");
    };

    // [POST] 임시 저장 (createStocktakeSheet 연동)
    const saveDraft = async () => {
        setIsSaving(true);
        try {
            // 백엔드 StocktakeDto.CreateRequest 구조와 매핑
            const requestBody = {
                title: title,
                items: items
                    .filter(i => i.stocktakeQty !== "")
                    .map(i => ({
                        ingredientId: i.ingredientId,
                        stocktakeQty: parseFloat(i.stocktakeQty as string)
                    }))
            };

            console.log("Saving to API:", requestBody);

            // 실제 API 호출 시뮬레이션
            // const response = await fetch(`/api/stocktakes/${storePublicId}`, { ... });
            // const newSheetId = await response.json();

            setTimeout(() => {
                const mockNewSheetId = sheetId || Math.floor(Math.random() * 10000);
                setSheetId(mockNewSheetId);
                setStatus("SAVED");
                setIsSaving(false);
            }, 800);
        } catch (error) {
            console.error("저장 실패:", error);
            setIsSaving(false);
        }
    };

    // [POST] 전표 확정 (confirmSheet 연동)
    const confirmStocktake = async () => {
        if (!sheetId) {
            alert("먼저 임시저장을 진행해 주세요.");
            return;
        }

        if (!window.confirm("재고 실사를 확정하시겠습니까? 확정 후에는 실제 재고량이 조정되며 수정할 수 없습니다.")) return;

        setIsConfirming(true);
        try {
            console.log(`Confirming Sheet ID: ${sheetId} for Store: ${storePublicId}`);

            // 실제 API 호출 시뮬레이션
            // await fetch(`/api/stocktakes/${storePublicId}/${sheetId}/confirm`, { method: 'POST' });

            setTimeout(() => {
                setStatus("CONFIRMED");
                setIsConfirming(false);
                localStorage.removeItem(`stocktake_draft_${storePublicId}`);
                alert("재고 실사가 성공적으로 확정되어 장부가 업데이트되었습니다.");
            }, 1000);
        } catch (error) {
            console.error("확정 실패:", error);
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
                                    <tr key={item.ingredientId} className={`hover:bg-slate-50 transition-colors ${status === "CONFIRMED" ? "opacity-75" : ""}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{item.name}</div>
                                            <div className="text-xs text-slate-400">코드: {item.ingredientId}</div>
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
                                                    onChange={(e) => handleQtyChange(item.ingredientId, e.target.value)}
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
