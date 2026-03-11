import {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {requireStorePublicId} from "@/utils/store";
import {
    createManualInbound,
    resolveAllIngredients,
    normalizeAllProductNames
} from "@/api/stock/inbound.ts";
import {analyzeReceipt} from "@/api/ocr/ocr.ts";
// 정의하신 타입을 기반으로 import
import type {ReceiptResponse, Field, FieldStatus} from "@/types/ocr/ocr";
import type {VendorResponse} from "@/types/reference/vendor";
import VendorSelectModal from "@/components/stock/VendorSelectModal";


// 개별 필드의 상태 및 메시지 정보 타입
type FieldMeta = {
    status: FieldStatus;
    message: string | null;
};

// 화면 입력 폼을 위한 확장 타입
type ItemDraft = {
    id: string;
    rawProductName: string;
    quantity: number;
    unitCost: string;
    expirationDate: string;
    // 필드별 OCR 상태 정보 저장
    meta: {
        rawProductName: FieldMeta;
        quantity: FieldMeta;
        unitCost: FieldMeta;
        expirationDate: FieldMeta;
    };
};

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

    const [selectedVendor, setSelectedVendor] = useState<VendorResponse | null>(null);
    const [inboundDate, setInboundDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<ItemDraft[]>([createEmptyItem()]);

    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // 필드 상태에 따른 Tailwind 클래스 반환
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

    const handleOCRClick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                setScanning(true);
                setErrors([]);

                const response = await analyzeReceipt(file);
                const result: ReceiptResponse = response.results
                    ? response.results[0]
                    : (Array.isArray(response) ? response[0] : response);

                if (result) {
                    const ocrWarnings: string[] = [];

                    // 1. 거래처 자동 매핑 로직 추가 (기존 구조 유지)
                    if (result.vendor && result.vendor.id?.value) {
                        setSelectedVendor({
                            vendorPublicId: result.vendor.id.value,
                            name: result.vendor.name?.value || "자동 매핑된 거래처",
                        } as Partial<VendorResponse> as VendorResponse);

                    } else if (result.vendor?.name?.status !== "GREEN") {
                        ocrWarnings.push(`거래처 매칭 실패: ${result.vendor.name.value}`);
                    }

                    // 2. 입고 일자 설정
                    if (result.date?.value) setInboundDate(String(result.date.value));

                    // 3. 품목 리스트 처리
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
                                    quantity: {
                                        status: it.quantity.status,
                                        message: it.quantity.message
                                    },
                                    unitCost: {
                                        status: it.costPrice.status,
                                        message: it.costPrice.message
                                    },
                                    expirationDate: {
                                        status: (it.expirationDate?.status) || "GREEN",
                                        message: it.expirationDate?.message || null
                                    },
                                }
                            };
                        });

                        setItems(newItems);
                        if (ocrWarnings.length > 0) setErrors(ocrWarnings);
                    }
                }
            } catch (err) {
                console.error(err);
                setErrors(["OCR 분석 중 오류가 발생했습니다."]);
            } finally {
                setScanning(false);
            }
        };
        input.click();
    };

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
        <div className="min-h-screen bg-gray-50/30">
            <div className="mx-auto w-full max-w-6xl px-6 py-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                    <div className="flex items-start gap-3">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900">입고 등록</h1>
                            <p className="mt-3 text-sm text-gray-500">입고 정보를 등록하고 품목을 관리합니다.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={scanning}
                            onClick={handleOCRClick}
                            className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold transition ${scanning ? "text-gray-400 cursor-not-allowed" : "text-gray-800 hover:bg-gray-50"}`}
                        >
                            {scanning ? "스캔 중..." : "명세서 스캔"}
                        </button>
                        <button
                            type="button"
                            disabled={!canSubmit || submitting}
                            onClick={handleSubmitRegister}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${!canSubmit || submitting ? "bg-gray-300 text-gray-600" : "bg-black text-white hover:bg-gray-800"}`}
                        >
                            {submitting ? "처리 중..." : "입고 등록"}
                        </button>
                    </div>
                </div>

                {/* 에러 메시지 표시 */}
                {errors.length > 0 && (
                    <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 px-5 py-4">
                        <div className="text-sm font-bold text-amber-900">확인 필요한 항목이 있습니다</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                            {errors.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                    </div>
                )}

                {/* 기본 정보 */}
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 md:col-span-6">
                            <label className="text-sm font-bold text-gray-700">거래처</label>
                            <button type="button" onClick={() => setIsVendorModalOpen(true)}
                                    className="mt-2 flex w-full items-center justify-between rounded-xl border-2 border-gray-100 bg-white px-4 py-3 text-sm transition hover:border-gray-300">
                                <span className={selectedVendor ? "text-gray-900 font-medium" : "text-gray-400"}>
                                    {selectedVendor ? selectedVendor.name : "거래처 선택 (선택사항)"}
                                </span>
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <label className="text-sm font-bold text-gray-700">입고일자</label>
                            <input type="date" value={inboundDate} onChange={(e) => setInboundDate(e.target.value)}
                                   className="mt-2 w-full rounded-xl border-2 border-gray-100 px-4 py-3 text-sm font-medium focus:border-black outline-none transition"/>
                        </div>
                    </div>
                </div>

                {/* 품목 리스트 */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">입고 품목</h2>
                        <button onClick={() => setItems([...items, createEmptyItem()])}
                                className="text-sm font-bold text-blue-600 hover:text-blue-700">+ 품목 직접 추가
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase">품목명</th>
                                <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase w-[120px]">수량</th>
                                <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase w-[150px]">단가</th>
                                <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase w-[180px]">유통기한</th>
                                <th className="px-6 py-4 w-[60px]"></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {items.map((it) => (
                                <tr key={it.id} className="group">
                                    <td className="px-6 py-4 align-top">
                                        <input
                                            value={it.rawProductName}
                                            onChange={(e) => updateRow(it.id, {rawProductName: e.target.value})}
                                            placeholder="품목명 입력"
                                            className={`w-full rounded-lg border-2 px-3 py-2 text-sm font-medium outline-none transition-all ${getFieldStyles(it.meta.rawProductName.status)}`}
                                        />
                                        {it.meta.rawProductName.message && (
                                            <p className="mt-1 text-[11px] font-medium text-red-500">{it.meta.rawProductName.message}</p>
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
                                            className={`w-full rounded-lg border-2 px-3 py-2 text-sm text-right font-medium outline-none transition-all ${getFieldStyles(it.meta.quantity.status)}`}
                                        />
                                        {it.meta.quantity.message && (
                                            <p className="mt-1 text-[11px] font-medium text-red-500">{it.meta.quantity.message}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                        <input
                                            value={it.unitCost}
                                            onChange={(e) => updateRow(it.id, {unitCost: e.target.value})}
                                            className={`w-full rounded-lg border-2 px-3 py-2 text-sm text-right font-medium outline-none transition-all ${getFieldStyles(it.meta.unitCost.status)}`}
                                        />
                                        {it.meta.unitCost.message && (
                                            <p className="mt-1 text-[11px] font-medium text-red-500">{it.meta.unitCost.message}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={it.expirationDate}
                                                onChange={(e) => updateRow(it.id, {expirationDate: e.target.value})}
                                                className={`w-full rounded-lg border-2 px-3 py-2 text-sm font-medium outline-none transition-all ${getFieldStyles(it.meta.expirationDate.status)}`}
                                            />
                                            {it.meta.expirationDate.status !== "GREEN" && (
                                                <span
                                                    className={`absolute -top-2 -right-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm ${it.meta.expirationDate.status === "RED" ? "bg-red-500" : "bg-amber-400"}`}>
                                                        {it.meta.expirationDate.status}
                                                    </span>
                                            )}
                                        </div>
                                        {it.meta.expirationDate.message && (
                                            <p className={`mt-1 text-[11px] font-medium ${it.meta.expirationDate.status === "RED" ? "text-red-500" : "text-amber-600"}`}>
                                                {it.meta.expirationDate.message}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top text-right">
                                        <button onClick={() => removeRow(it.id)}
                                                className="text-gray-300 hover:text-red-500 text-xl transition-colors">×
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <VendorSelectModal
                    isOpen={isVendorModalOpen}
                    onClose={() => setIsVendorModalOpen(false)}
                    onSelect={setSelectedVendor}
                    storePublicId={String(storePublicId)}
                    selectedVendorPublicId={selectedVendor?.vendorPublicId}
                />
            </div>
        </div>
    );
}