import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requireStorePublicId } from "@/utils/store";
import { createManualInbound } from "@/api/inboundApi";
import type { ManualInboundRequest } from "@/types";

type ItemDraft = {
    id: string;
    rawProductName: string;
    quantity: string;
    unitCost: string;
    expirationDate: string;
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

export default function ReceiveRegisterPage() {
    const navigate = useNavigate();
    const storePublicId = requireStorePublicId();

    const [vendorId, setVendorId] = useState<string>("");
    const [inboundDate, setInboundDate] = useState<string>(todayLocal());
    const [items, setItems] = useState<ItemDraft[]>([
        { id: newId(), rawProductName: "", quantity: "", unitCost: "", expirationDate: "" },
    ]);

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

        if (vendorId && (!Number.isFinite(Number(vendorId)) || Number(vendorId) <= 0)) {
            list.push("거래처 ID는 양의 숫자여야 합니다.");
        }

        return list;
    };

    const handleSubmitRegister = async () => {
        const v = validate();
        setErrors(v);
        if (v.length > 0) return;

        const payload: ManualInboundRequest = {
            vendorId: vendorId ? Number(vendorId) : null,
            inboundDate,
            items: items.map((it) => ({
                rawProductName: it.rawProductName.trim(),
                quantity: Number(it.quantity),
                unitCost: Number(it.unitCost),
                expirationDate: it.expirationDate ? it.expirationDate : null,
                specText: null, // specText 가 DTO에 있으므로 추가 (필요시 UI 확장 가능)
            })),
        };

        try {
            setSubmitting(true);
            const response = await createManualInbound(String(storePublicId), payload);
            if (response && response.inboundPublicId) {
                navigate(`/stock/receiving/${response.inboundPublicId}`);
            } else {
                navigate("/stock/receiving");
            }
        } catch (e) {
            console.error(e);
            setErrors(["입고 등록에 실패했습니다. 엔드포인트/콘솔 로그를 확인해 주세요."]);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto w-full max-w-5xl px-6 py-8">
                {/* 상단 헤더: 검정 바 제거, 흰 배경 타이틀 + 검정 CTA */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="mt-1 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
                        >
                            뒤로
                        </button>

                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-gray-900">입고 등록</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* OCR은 라우트/기능 준비되면 연결 */}
                        <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-400 cursor-not-allowed"
                            title="OCR 기능 준비 중"
                        >
                            명세서 스캔 (OCR)
                        </button>

                        <button
                            type="button"
                            disabled={!canSubmit || submitting}
                            onClick={handleSubmitRegister}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${!canSubmit || submitting
                                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                    : "bg-black text-white hover:bg-gray-900"
                                }`}
                        >
                            {submitting ? "처리 중..." : "입고 등록"}
                        </button>
                    </div>
                </div>

                {/* 에러 */}
                {errors.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
                        <div className="text-sm font-black text-red-800">입력 오류</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                            {errors.map((m, i) => (
                                <li key={`${m}_${i}`}>{m}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 기본 정보 */}
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="text-base font-black text-gray-900">기본 정보</div>

                    <div className="mt-5 grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-6">
                            <label className="text-xs font-black text-gray-500">거래처 ID (vendorId)</label>
                            <input
                                value={vendorId}
                                onChange={(e) => setVendorId(e.target.value)}
                                inputMode="numeric"
                                placeholder="예: 1"
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white"
                            />
                            <div className="mt-2 text-xs text-gray-400">
                                현재는 vendorId만 받습니다. (거래처 검색/선택 UI는 추후 연결)
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-6">
                            <label className="text-xs font-black text-gray-500">입고일자 (inboundDate)</label>
                            <input
                                type="date"
                                value={inboundDate}
                                onChange={(e) => setInboundDate(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* 품목 리스트 */}
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-base font-black text-gray-900">입고 품목</div>
                            <div className="mt-1 text-xs text-gray-400">
                                rawProductName / quantity / unitCost / expirationDate 만 입력합니다.
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={addRow}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-800 hover:bg-gray-50"
                        >
                            품목 추가
                        </button>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[900px] border-separate border-spacing-0">
                            <thead>
                                <tr className="text-left text-xs font-black text-gray-500">
                                    <th className="border-b border-gray-200 pb-3 pr-3">품목명 (rawProductName)</th>
                                    <th className="border-b border-gray-200 pb-3 pr-3 w-[140px]">수량</th>
                                    <th className="border-b border-gray-200 pb-3 pr-3 w-[160px]">단가</th>
                                    <th className="border-b border-gray-200 pb-3 pr-3 w-[170px]">유통기한</th>
                                    <th className="border-b border-gray-200 pb-3 w-[70px] text-right">삭제</th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((it) => (
                                    <tr key={it.id} className="align-top">
                                        <td className="py-3 pr-3">
                                            <input
                                                value={it.rawProductName}
                                                onChange={(e) => updateRow(it.id, { rawProductName: e.target.value })}
                                                placeholder="예: 서울우유 저지방 우유 1L"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white"
                                            />
                                        </td>

                                        <td className="py-3 pr-3">
                                            <input
                                                value={it.quantity}
                                                onChange={(e) => updateRow(it.id, { quantity: e.target.value })}
                                                inputMode="decimal"
                                                placeholder="예: 6"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white text-right"
                                            />
                                        </td>

                                        <td className="py-3 pr-3">
                                            <input
                                                value={it.unitCost}
                                                onChange={(e) => updateRow(it.id, { unitCost: e.target.value })}
                                                inputMode="decimal"
                                                placeholder="예: 2500"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white text-right"
                                            />
                                        </td>

                                        <td className="py-3 pr-3">
                                            <input
                                                type="date"
                                                value={it.expirationDate}
                                                onChange={(e) => updateRow(it.id, { expirationDate: e.target.value })}
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white"
                                            />
                                        </td>

                                        <td className="py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removeRow(it.id)}
                                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                title="삭제"
                                            >
                                                삭제
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

                    <div className="mt-5 text-xs text-gray-400">
                        상단의 “입고 등록” 버튼은 입력값 검증 통과 시에만 활성화됩니다.
                    </div>
                </div>
            </div>
        </div>
    );
}