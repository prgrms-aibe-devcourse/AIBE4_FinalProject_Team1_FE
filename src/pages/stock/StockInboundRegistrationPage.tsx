import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requireStorePublicId } from "@/utils/store";
import {
    createManualInbound,
    resolveAllIngredients,
    normalizeAllProductNames
} from "@/api/stock/inbound.ts";
import { analyzeReceipt } from "@/api/ocr/ocr.ts";
import type { Item as OCRItem, ManualInboundRequest } from "@/types";
import type { VendorResponse } from "@/types/reference/vendor";
import VendorSelectModal from "@/components/stock/VendorSelectModal";

type ItemDraft = {
    id: string;
    rawProductName: string;
    quantity: string;
    unitCost: string;
    expirationDate: string;
};

type OCRWrappedValue<T> = {
    value?: T | null;
};

type OCRValue<T> = T | OCRWrappedValue<T> | null | undefined;

type OCRItemShape = OCRItem & {
    rawProductName?: OCRValue<string>;
    productName?: OCRValue<string>;
    itemName?: OCRValue<string>;
    name?: OCRValue<string>;
    quantity?: OCRValue<string | number>;
    costPrice?: OCRValue<string | number>;
    expirationDate?: OCRValue<string>;
    ingredient?: {
        name?: OCRValue<string>;
    } | null;
};

type InboundDetailNavigationState = {
    resolvedNormalizedKeyByItemId: Record<string, string>;
};

function newId() {
    return crypto.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
}

function todayLocal() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function isWrappedOCRValue<T>(input: OCRValue<T>): input is OCRWrappedValue<T> {
    return typeof input === "object" && input !== null && "value" in input;
}

function unwrapOCRValue<T>(input: OCRValue<T>): T | undefined {
    if (input == null) return undefined;
    if (isWrappedOCRValue(input)) {
        return input.value ?? undefined;
    }
    return input;
}

function toText(value: unknown): string {
    if (value == null) return "";
    return String(value).trim();
}

/**
 * 상품명은 반드시 "원본 상품명"만 추출합니다.
 * 재료명(ingredient.name)은 fallback으로 절대 사용하지 않습니다.
 */
function extractOCRRawProductName(item: OCRItem): string {
    const source = item as OCRItemShape;

    return [
        unwrapOCRValue(source.rawProductName),
        unwrapOCRValue(source.productName),
        unwrapOCRValue(source.itemName),
        unwrapOCRValue(source.name),
    ]
        .map(toText)
        .find((value) => value.length > 0) ?? "";
}

function extractOCRQuantity(item: OCRItem): string {
    const source = item as OCRItemShape;
    return toText(unwrapOCRValue(source.quantity));
}

function extractOCRUnitCost(item: OCRItem): string {
    const source = item as OCRItemShape;
    return toText(unwrapOCRValue(source.costPrice));
}

function extractOCRExpirationDate(item: OCRItem): string {
    const source = item as OCRItemShape;
    return toText(unwrapOCRValue(source.expirationDate));
}

export default function StockInboundRegistrationPage() {
    const navigate = useNavigate();
    const storePublicId = requireStorePublicId();

    const [selectedVendor, setSelectedVendor] = useState<VendorResponse | null>(null);
    const [inboundDate, setInboundDate] = useState<string>(todayLocal());
    const [items, setItems] = useState<ItemDraft[]>([
        { id: newId(), rawProductName: "", quantity: "", unitCost: "", expirationDate: "" },
    ]);

    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const canSubmit = useMemo(() => {
        if (!storePublicId) return false;
        if (!inboundDate) return false;
        if (items.length === 0) return false;

        for (const it of items) {
            if (!it.rawProductName.trim()) return false;
            const q = Number(it.quantity);
            const c = Number(it.unitCost);
            if (!Number.isFinite(q) || q <= 0) return false;
            if (!Number.isFinite(c) || c <= 0) return false;
        }
        return true;
    }, [storePublicId, inboundDate, items]);

    const addRow = () => {
        setItems((prev) => [
            ...prev,
            { id: newId(), rawProductName: "", quantity: "", unitCost: "", expirationDate: "" },
        ]);
    };

    const removeRow = (id: string) => {
        setItems((prev) => prev.filter((x) => x.id !== id));
    };

    const updateRow = (id: string, patch: Partial<ItemDraft>) => {
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    };

    const validate = (): string[] => {
        const list: string[] = [];

        if (!storePublicId) list.push("storePublicId가 필요합니다(스토어 선택/헤더 확인).");
        if (!inboundDate) list.push("입고일자를 입력해 주세요.");

        if (items.length === 0) {
            list.push("최소 1개 이상의 품목을 추가해 주세요.");
            return list;
        }

        items.forEach((it, idx) => {
            const row = idx + 1;
            if (!it.rawProductName.trim()) list.push(`${row}행: 품목명을 입력해 주세요.`);
            const q = Number(it.quantity);
            if (!Number.isFinite(q) || q <= 0) list.push(`${row}행: 수량은 0보다 큰 숫자여야 합니다.`);
            const c = Number(it.unitCost);
            if (!Number.isFinite(c) || c <= 0) list.push(`${row}행: 단가는 0보다 큰 숫자여야 합니다.`);
            if (it.expirationDate && !/^\d{4}-\d{2}-\d{2}$/.test(it.expirationDate)) {
                list.push(`${row}행: 유통기한 형식이 올바르지 않습니다(YYYY-MM-DD).`);
            }
        });

        return list;
    };

    const handleOCRClick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                setScanning(true);
                setErrors([]);

                const result = await analyzeReceipt(file);

                if (result.items && result.items.length > 0) {
                    let missingRawProductNameCount = 0;

                    const newItems: ItemDraft[] = result.items.map((it: OCRItem) => {
                        const rawProductName = extractOCRRawProductName(it);

                        if (!rawProductName) {
                            missingRawProductNameCount += 1;
                        }

                        return {
                            id: newId(),
                            rawProductName,
                            quantity: extractOCRQuantity(it),
                            unitCost: extractOCRUnitCost(it),
                            expirationDate: extractOCRExpirationDate(it),
                        };
                    });

                    setItems(newItems);

                    if (missingRawProductNameCount > 0) {
                        setErrors([
                            `OCR 결과에서 ${missingRawProductNameCount}개 항목의 상품명을 찾지 못했습니다. 재료명으로 대체하지 않았으니 직접 확인해 주세요.`,
                        ]);
                    }
                } else {
                    setErrors(["OCR 분석 결과 품목을 찾지 못했습니다."]);
                }
            } catch (err) {
                console.error("OCR Error:", err);
                setErrors(["명세서 분석 중 오류가 발생했습니다."]);
            } finally {
                setScanning(false);
            }
        };
        input.click();
    };

    const handleSubmitRegister = async () => {
        const v = validate();
        setErrors(v);
        if (v.length > 0) return;
        if (!storePublicId) return;

        const payload: ManualInboundRequest = {
            inboundDate,
            vendorPublicId: selectedVendor?.vendorPublicId ?? null,
            items: items.map((it) => ({
                rawProductName: it.rawProductName.trim(),
                quantity: Number(String(it.quantity).replace(/[^0-9.-]/g, "")),
                unitCost: Number(String(it.unitCost).replace(/[^0-9.-]/g, "")),
                expirationDate: it.expirationDate ? it.expirationDate : null,
                specText: null,
            })),
        };

        try {
            setSubmitting(true);

            const storeId = String(storePublicId);

            const createResponse = await createManualInbound(storeId, payload);
            if (!createResponse?.inboundPublicId) {
                throw new Error("입고 생성 응답이 올바르지 않습니다.");
            }

            const inboundPublicId = createResponse.inboundPublicId;

            await normalizeAllProductNames(storeId, inboundPublicId);
            const resolveResponse = await resolveAllIngredients(storeId, inboundPublicId);

            const resolvedNormalizedKeyByItemId = resolveResponse.items.reduce<Record<string, string>>((acc, item) => {
                if (item.normalizedRawKey) {
                    acc[item.inboundItemPublicId] = item.normalizedRawKey;
                }
                return acc;
            }, {});

            navigate(`/stock/inbound/${inboundPublicId}`, {
                state: {
                    resolvedNormalizedKeyByItemId,
                } satisfies InboundDetailNavigationState,
            });
        } catch (error) {
            console.error(error);
            alert("입고 생성 또는 정규화 처리 중 오류가 발생했습니다. 다시 시도해주십시오.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-5xl px-6 py-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-gray-900">입고 등록</h1>
                            <p className="mt-1 text-sm text-gray-500">수기로 입고 정보를 등록합니다</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={scanning}
                            onClick={handleOCRClick}
                            className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold transition ${
                                scanning
                                    ? "cursor-not-allowed text-gray-400"
                                    : "text-gray-800 hover:bg-gray-50"
                            }`}
                        >
                            {scanning ? "스캔 중..." : "명세서 스캔"}
                        </button>

                        <button
                            type="button"
                            disabled={!canSubmit || submitting}
                            onClick={handleSubmitRegister}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                !canSubmit || submitting
                                    ? "cursor-not-allowed bg-gray-300 text-gray-600"
                                    : "bg-black text-white hover:bg-gray-800"
                            }`}
                        >
                            {submitting ? "처리 중..." : "입고 등록"}
                        </button>
                    </div>
                </div>

                {errors.length > 0 && (
                    <div className="mt-6 rounded-xl border-2 border-red-200 bg-red-50 px-5 py-4">
                        <div className="text-sm font-bold text-red-900">입력 오류</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                            {errors.map((m, i) => (
                                <li key={`${m}_${i}`}>{m}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-6 rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                    <div className="text-base font-bold text-gray-900">기본 정보</div>

                    <div className="mt-5 grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-6">
                            <label className="text-sm font-bold text-gray-700">거래처</label>
                            <button
                                type="button"
                                onClick={() => setIsVendorModalOpen(true)}
                                className="mt-2 flex w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-black"
                            >
                                <span className={selectedVendor ? "font-medium text-gray-900" : "text-gray-400"}>
                                    {selectedVendor ? selectedVendor.name : "거래처 선택 (선택사항)"}
                                </span>
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="col-span-12 md:col-span-6">
                            <label className="text-sm font-bold text-gray-700">입고일자</label>
                            <input
                                type="date"
                                value={inboundDate}
                                onChange={(e) => setInboundDate(e.target.value)}
                                className="mt-2 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-black"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-base font-bold text-gray-900">입고 품목</div>
                            <div className="mt-1 text-sm text-gray-500">
                                입고할 품목 정보를 입력해 주세요
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={addRow}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                        >
                            + 품목 추가
                        </button>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[900px] border-separate border-spacing-0">
                            <thead>
                            <tr className="text-left text-xs font-black text-gray-600">
                                <th className="border-b-2 border-gray-200 pb-3 pr-3">품목명</th>
                                <th className="border-b-2 border-gray-200 pb-3 pr-3 w-[140px]">수량</th>
                                <th className="border-b-2 border-gray-200 pb-3 pr-3 w-[160px]">단가</th>
                                <th className="border-b-2 border-gray-200 pb-3 pr-3 w-[170px]">유통기한</th>
                                <th className="border-b-2 border-gray-200 pb-3 w-[70px] text-right"></th>
                            </tr>
                            </thead>

                            <tbody>
                            {items.map((it) => (
                                <tr key={it.id} className="align-top">
                                    <td className="py-3 pr-3">
                                        <input
                                            value={it.rawProductName}
                                            onChange={(e) => updateRow(it.id, { rawProductName: e.target.value })}
                                            placeholder="서울우유 저지방 우유 1L"
                                            className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition focus:border-black"
                                        />
                                    </td>

                                    <td className="py-3 pr-3">
                                        <input
                                            value={it.quantity}
                                            onChange={(e) => updateRow(it.id, { quantity: e.target.value })}
                                            inputMode="decimal"
                                            placeholder="6"
                                            className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition focus:border-black text-right"
                                        />
                                    </td>

                                    <td className="py-3 pr-3">
                                        <input
                                            value={it.unitCost}
                                            onChange={(e) => updateRow(it.id, { unitCost: e.target.value })}
                                            inputMode="decimal"
                                            placeholder="2500"
                                            className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition focus:border-black text-right"
                                        />
                                    </td>

                                    <td className="py-3 pr-3">
                                        <input
                                            type="date"
                                            value={it.expirationDate}
                                            onChange={(e) => updateRow(it.id, { expirationDate: e.target.value })}
                                            className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-black"
                                        />
                                    </td>

                                    <td className="py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(it.id)}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-200 bg-white text-xl text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                            title="삭제"
                                        >
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-sm font-bold text-gray-400">
                                        품목이 없습니다. “품목 추가”를 눌러 주세요.
                                    </td>
                                </tr>
                            )}
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