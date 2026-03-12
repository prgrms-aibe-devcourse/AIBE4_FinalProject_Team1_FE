import {useMemo, useState, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {requireStorePublicId} from "@/utils/store";
import {
    createManualInbound,
    resolveAllIngredients,
    normalizeAllProductNames
} from "@/api/stock/inbound.ts";
import {analyzeReceipt} from "@/api/ocr/ocr.ts";
import type {ReceiptResponse, Field, FieldStatus} from "@/types/ocr/ocr";
import type {VendorResponse} from "@/types/reference/vendor";
import VendorSelectModal from "@/components/stock/VendorSelectModal";

// --- Types ---
type FieldMeta = {
    status: FieldStatus;
    message: string | null;
};

type ItemDraft = {
    id: string;
    rawProductName: string;
    quantity: number;
    unitCost: string;
    expirationDate: string;
    meta: {
        rawProductName: FieldMeta;
        quantity: FieldMeta;
        unitCost: FieldMeta;
        expirationDate: FieldMeta;
    };
};

// --- Utils ---
function newId() {
    return crypto.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
}

const DEFAULT_META: FieldMeta = {status: "GREEN", message: null};

function createEmptyItem(): ItemDraft {
    return {
        id: newId(),
        rawProductName: "",
        quantity: 0,
        unitCost: "",
        expirationDate: "",
        meta: {
            rawProductName: {...DEFAULT_META},
            quantity: {...DEFAULT_META},
            unitCost: {...DEFAULT_META},
            expirationDate: {...DEFAULT_META},
        }
    };
}

function unwrapField<T>(field: Field<T> | undefined | null): string {
    if (!field || field.value === null || field.value === undefined) return "";
    return String(field.value).trim();
}

export default function StockInboundRegistrationPage() {
    const navigate = useNavigate();
    const storePublicId = requireStorePublicId();

    // --- State: Core Data ---
    const [selectedVendor, setSelectedVendor] = useState<VendorResponse | null>(null);
    const [inboundDate, setInboundDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<ItemDraft[]>([createEmptyItem()]);

    // --- State: UI Control ---
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // --- State: OCR Panel ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // --- Handlers: UI ---
    const toggleOCRPanel = () => {
        setIsPanelOpen(!isPanelOpen);
        if (isPanelOpen) {
            setPreviewUrl(null);
            setSelectedFile(null);
        }
    };

    const getFieldStyles = (status: FieldStatus) => {
        switch (status) {
            case "RED":
                return "border-red-500 bg-red-50 focus:border-red-600";
            case "YELLOW":
                return "border-amber-400 bg-amber-50 focus:border-amber-500";
            default:
                return "border-gray-200 bg-white focus:border-black";
        }
    };

    const updateRow = (id: string, patch: Partial<ItemDraft>) => {
        setItems((prev) => prev.map((x) => (x.id === id ? {...x, ...patch} : x)));
    };

    const removeRow = (id: string) => {
        setItems((prev) => prev.filter((x) => x.id !== id));
    };

    // --- Handlers: OCR Logic ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const processOCR = async () => {
        if (!selectedFile) return;

        try {
            setIsProcessing(true);
            setErrors([]);

            const response = await analyzeReceipt(selectedFile);
            const result: ReceiptResponse = response.results
                ? response.results[0]
                : (Array.isArray(response) ? response[0] : response);

            if (result) {
                const ocrWarnings: string[] = [];

                // 1. 거래처 매핑
                if (result.vendor && result.vendor.id?.value) {
                    setSelectedVendor({
                        vendorPublicId: result.vendor.id.value,
                        name: result.vendor.name?.value || "자동 매핑된 거래처",
                    } as VendorResponse);
                }

                // 2. 입고 일자
                if (result.date?.value) setInboundDate(String(result.date.value));

                // 3. 품목 리스트
                if (result.items) {
                    const newItems: ItemDraft[] = result.items.map((it, idx) => {
                        if (it.ingredient.name.status === "RED") ocrWarnings.push(`${idx + 1}행: 품목명 확인 필요`);
                        return {
                            id: newId(),
                            rawProductName: unwrapField(it.ingredient.name),
                            quantity: Number.parseFloat(unwrapField(it.quantity)) || 0,
                            unitCost: unwrapField(it.costPrice),
                            expirationDate: unwrapField(it.expirationDate),
                            meta: {
                                rawProductName: {
                                    status: it.ingredient.name.status,
                                    message: it.ingredient.name.message
                                },
                                quantity: {status: it.quantity.status, message: it.quantity.message},
                                unitCost: {status: it.costPrice.status, message: it.costPrice.message},
                                expirationDate: {
                                    status: it.expirationDate?.status || "GREEN",
                                    message: it.expirationDate?.message || null
                                },
                            }
                        };
                    });
                    setItems(newItems);
                    if (ocrWarnings.length > 0) setErrors(ocrWarnings);
                }

                setShowToast(true);
                setTimeout(() => {
                    setShowToast(false);
                    toggleOCRPanel();
                }, 1500);
            }
        } catch (err) {
            console.error(err);
            setErrors(["OCR 분석 중 오류가 발생했습니다."]);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Handlers: Submit ---
    const canSubmit = useMemo(() => {
        if (!storePublicId || items.length === 0) return false;
        return items.every(it => it.rawProductName.trim() && Number(it.quantity) > 0);
    }, [storePublicId, items]);

    const handleSubmitRegister = async () => {
        if (!canSubmit || !storePublicId) return;
        try {
            setSubmitting(true);
            const payload = {
                inboundDate,
                vendorPublicId: selectedVendor?.vendorPublicId ?? null,
                items: items.map((it) => ({
                    rawProductName: it.rawProductName.trim(),
                    quantity: it.quantity || 0,
                    unitCost: Number(it.unitCost.replace(/[^0-9.-]/g, "")),
                    expirationDate: it.expirationDate || null,
                    specText: null,
                })),
            };

            const storeId = String(storePublicId);
            const res = await createManualInbound(storeId, payload);
            if (res?.inboundPublicId) {
                await normalizeAllProductNames(storeId, res.inboundPublicId);
                await resolveAllIngredients(storeId, res.inboundPublicId);
                navigate(`/stock/inbound/${res.inboundPublicId}`);
            }
        } catch (error) {
            console.error(error);
            alert("입고 등록 중 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30 relative overflow-x-hidden">
            <div className="mx-auto w-full max-w-6xl px-6 py-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">입고 등록</h1>
                        <p className="mt-2 text-sm text-gray-500">명세서를 스캔하거나 품목을 직접 입력하세요.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleOCRPanel}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-50 transition shadow-sm"
                        >
                            명세서 스캔 도구
                        </button>
                        <button
                            type="button"
                            disabled={!canSubmit || submitting}
                            onClick={handleSubmitRegister}
                            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition shadow-sm ${!canSubmit || submitting ? "bg-gray-300 text-gray-600" : "bg-black text-white hover:bg-gray-800"}`}
                        >
                            {submitting ? "처리 중..." : "입고 등록 완료"}
                        </button>
                    </div>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                    <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 px-5 py-4">
                        <div className="text-sm font-bold text-amber-900">확인 필요한 항목</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                            {errors.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                    </div>
                )}

                {/* Base Info */}
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 md:col-span-6">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">거래처</label>
                            <button type="button" onClick={() => setIsVendorModalOpen(true)}
                                    className="mt-2 flex w-full items-center justify-between rounded-xl border-2 border-gray-100 bg-white px-4 py-3 text-sm transition hover:border-gray-300">
                                <span
                                    className={selectedVendor ? "text-gray-900 font-bold" : "text-gray-400 font-medium"}>
                                    {selectedVendor ? selectedVendor.name : "거래처를 선택하세요 (선택)"}
                                </span>
                                <span className="text-gray-400">▼</span>
                            </button>
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">입고 일자</label>
                            <input type="date" value={inboundDate} onChange={(e) => setInboundDate(e.target.value)}
                                   className="mt-2 w-full rounded-xl border-2 border-gray-100 px-4 py-3 text-sm font-bold focus:border-black outline-none transition"/>
                        </div>
                    </div>
                </div>

                {/* Item List */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-20">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">입고 품목 리스트</h2>
                        <button onClick={() => setItems([...items, createEmptyItem()])}
                                className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">+
                            직접 추가
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">품목명</th>
                                <th className="px-4 py-4 text-left text-xs font-black text-gray-400 uppercase w-[120px]">수량</th>
                                <th className="px-4 py-4 text-left text-xs font-black text-gray-400 uppercase w-[150px]">단가</th>
                                <th className="px-4 py-4 text-left text-xs font-black text-gray-400 uppercase w-[180px]">유통기한</th>
                                <th className="px-6 py-4 w-[60px]"></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {items.map((it) => (
                                <tr key={it.id} className="group hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-4 align-top">
                                        <input
                                            value={it.rawProductName}
                                            onChange={(e) => updateRow(it.id, {rawProductName: e.target.value})}
                                            placeholder="품목명 입력"
                                            className={`w-full rounded-lg border-2 px-3 py-2 text-sm font-bold outline-none transition-all ${getFieldStyles(it.meta.rawProductName.status)}`}
                                        />
                                        {it.meta.rawProductName.message && (
                                            <p className="mt-1 text-[11px] font-bold text-red-500">{it.meta.rawProductName.message}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                        <input
                                            value={it.quantity}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const numericValue = val === "" ? 0 : Number(val.replace(/[^0-9.-]/g, ""));
                                                updateRow(it.id, {quantity: numericValue});
                                            }}
                                            className={`w-full rounded-lg border-2 px-3 py-2 text-sm text-right font-bold outline-none transition-all ${getFieldStyles(it.meta.quantity.status)}`}
                                        />
                                        {it.meta.quantity.message && (
                                            <p className="mt-1 text-[11px] font-bold text-red-500">{it.meta.quantity.message}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                        <input
                                            value={it.unitCost}
                                            onChange={(e) => updateRow(it.id, {unitCost: e.target.value})}
                                            className={`w-full rounded-lg border-2 px-3 py-2 text-sm text-right font-bold outline-none transition-all ${getFieldStyles(it.meta.unitCost.status)}`}
                                        />
                                        {it.meta.unitCost.message && (
                                            <p className="mt-1 text-[11px] font-bold text-red-500">{it.meta.unitCost.message}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={it.expirationDate}
                                                onChange={(e) => updateRow(it.id, {expirationDate: e.target.value})}
                                                className={`w-full rounded-lg border-2 px-3 py-2 text-sm font-bold outline-none transition-all ${getFieldStyles(it.meta.expirationDate.status)}`}
                                            />
                                            {it.meta.expirationDate.status !== "GREEN" && (
                                                <span
                                                    className={`absolute -top-2 -right-1 px-1.5 py-0.5 rounded text-[10px] font-black text-white shadow-sm ${it.meta.expirationDate.status === "RED" ? "bg-red-500" : "bg-amber-400"}`}>
                                                        {it.meta.expirationDate.status}
                                                    </span>
                                            )}
                                        </div>
                                        {it.meta.expirationDate.message && (
                                            <p className={`mt-1 text-[11px] font-bold ${it.meta.expirationDate.status === "RED" ? "text-red-500" : "text-amber-600"}`}>
                                                {it.meta.expirationDate.message}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top text-right">
                                        <button onClick={() => removeRow(it.id)}
                                                className="text-gray-300 hover:text-red-500 text-xl transition-colors font-bold">×
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- OCR 사이드 패널 --- */}
            <div
                className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.15)] z-[60] transform transition-transform duration-500 ease-in-out flex flex-col ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#1a1a1a] text-white">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🔍</span>
                        <h3 className="font-black text-lg">명세서 분석 도구</h3>
                    </div>
                    <button onClick={toggleOCRPanel}
                            className="hover:bg-white/10 p-2 rounded-full transition-all text-xl">×
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* 업로드 구역 */}
                    <div
                        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center relative hover:border-black transition-colors group">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload}
                               accept="image/*,application/pdf"/>
                        <label onClick={() => fileInputRef.current?.click()} className="cursor-pointer block">
                            <div
                                className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-2xl">
                                📷
                            </div>
                            <p className="font-black text-black">명세서 파일 선택</p>
                            <p className="text-[11px] text-gray-400 mt-1 font-bold">사진 또는 PDF를 업로드하세요</p>
                        </label>
                    </div>

                    {/* 미리보기 영역 */}
                    {previewUrl && (
                        <div
                            className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-black min-h-[300px] flex items-center justify-center">
                            {selectedFile?.type === "application/pdf" ? (
                                <iframe src={`${previewUrl}#toolbar=0&navpanes=0`}
                                        className="w-full h-[500px] border-none"/>
                            ) : (
                                <img src={previewUrl}
                                     className={`w-full h-auto opacity-70 ${isProcessing ? 'blur-[1px]' : ''}`}
                                     alt="Preview"/>
                            )}
                            {isProcessing && (
                                <div
                                    className="absolute top-0 left-0 w-full h-1.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-scan z-10"></div>
                            )}
                        </div>
                    )}

                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                        <h4 className="text-[11px] font-black text-blue-600 mb-2 uppercase flex items-center gap-1">ℹ️
                            스캔 팁</h4>
                        <ul className="text-[11px] text-blue-700/80 space-y-1.5 leading-relaxed font-bold">
                            <li>• 글자가 뚜렷하게 보이도록 수평을 맞춰 촬영하세요.</li>
                            <li>• 여러 장일 경우 가장 선명한 페이지를 선택하세요.</li>
                            <li>• 분석 후 매핑되지 않은 품목은 직접 확인이 필요합니다.</li>
                        </ul>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                    <button onClick={toggleOCRPanel}
                            className="flex-1 py-3 text-sm font-black text-gray-600 hover:bg-gray-200 rounded-xl transition-all">취소
                    </button>
                    <button
                        onClick={processOCR}
                        disabled={!selectedFile || isProcessing}
                        className={`flex-[2] py-3 text-sm font-black text-white rounded-xl transition-all shadow-md ${!selectedFile || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
                    >
                        {isProcessing ? "분석 중..." : "데이터 적용하기"}
                    </button>
                </div>
            </div>

            {/* 토스트 메시지 */}
            <div
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl transform transition-all duration-500 flex items-center gap-3 z-[70] ${showToast ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0"}`}>
                <span className="text-emerald-400 text-xl">✅</span>
                <p className="font-black">데이터 분석이 성공적으로 완료되었습니다.</p>
            </div>

            <VendorSelectModal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onSelect={setSelectedVendor}
                storePublicId={String(storePublicId)}
                selectedVendorPublicId={selectedVendor?.vendorPublicId}
            />

            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 2.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}