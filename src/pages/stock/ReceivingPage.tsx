import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStockInbounds } from "@/api/stock";
import type { StockInboundResponse } from "@/types";
import { requireStorePublicId } from "@/utils/store";

type FilterKey = "ALL" | "DRAFT" | "CONFIRMED" | "NEED_MAPPING";

function formatDateOnly(dateStr?: string | null) {
    if (!dateStr) return "-";
    const idx = dateStr.indexOf("T");
    return idx > 0 ? dateStr.slice(0, idx) : dateStr;
}

function getResolvedCount(items: any[] | undefined) {
    if (!items || items.length === 0) return 0;
    return items.filter((it) => {
        const status = it.resolutionStatus;
        return status === "CONFIRMED" || status === "AUTO_RESOLVED" || it.ingredientId != null;
    }).length;
}

function getRepresentativeLabel(inbound: StockInboundResponse) {
    const items = inbound.items ?? [];
    if (items.length === 0) return "품목 없음";

    const confirmed = items.find((it) => it.ingredientName);
    if (confirmed?.ingredientName) return confirmed.ingredientName;

    const raw = items[0]?.rawProductName?.trim();
    return raw && raw.length > 0 ? raw : "재료 매핑 필요";
}

export default function ReceivingPage() {
    const navigate = useNavigate();
    const storePublicId = requireStorePublicId();

    const [inbounds, setInbounds] = useState<StockInboundResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterKey>("ALL");

    const fetchList = async () => {
        if (!storePublicId) return;
        try {
            setLoading(true);
            const data = await getStockInbounds(storePublicId);
            const inboundList = Array.isArray(data) ? data : data?.content || [];
            setInbounds(inboundList);
        } catch (error) {
            console.error("입고 목록 로드 실패:", error);
            setInbounds([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [storePublicId]);

    const stats = useMemo(() => {
        const all = inbounds ?? [];
        const draft = all.filter((x) => x.status !== "CONFIRMED");
        const confirmed = all.filter((x) => x.status === "CONFIRMED");

        const needMappingCount = all.reduce((acc, inbound) => {
            const items = inbound.items ?? [];
            const total = items.length;
            const resolved = getResolvedCount(items);
            return acc + Math.max(total - resolved, 0);
        }, 0);

        const needMappingInboundCount = all.filter((inbound) => {
            const items = inbound.items ?? [];
            if (items.length === 0) return false;
            const resolved = getResolvedCount(items);
            return resolved < items.length;
        }).length;

        return {
            total: all.length,
            draft: draft.length,
            confirmed: confirmed.length,
            needMappingCount,
            needMappingInboundCount,
        };
    }, [inbounds]);

    const filteredInbounds = useMemo(() => {
        const all = inbounds ?? [];

        if (filter === "ALL") return all;
        if (filter === "DRAFT") return all.filter((x) => x.status !== "CONFIRMED");
        if (filter === "CONFIRMED") return all.filter((x) => x.status === "CONFIRMED");
        if (filter === "NEED_MAPPING") {
            return all.filter((inbound) => {
                const items = inbound.items ?? [];
                if (items.length === 0) return false;
                const resolved = getResolvedCount(items);
                return resolved < items.length;
            });
        }
        return all;
    }, [inbounds, filter]);

    const handleRowClick = (publicId: string) => {
        navigate(`/stock/receiving/${publicId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto w-full max-w-6xl px-6 py-8">
                {/* 상단 헤더: 검정 바 제거, 흰 배경 타이틀 + 검정 CTA */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">입고 내역</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            입고 목록을 확인하고, 미매핑 품목은 검수/매핑을 진행하세요.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={fetchList}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-800 hover:bg-gray-50"
                        >
                            새로고침
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/stock/receiving/new")}
                            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white hover:bg-gray-900 transition"
                        >
                            새 입고 등록
                        </button>
                    </div>
                </div>

                {/* 필터/요약 */}
                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFilter("ALL")}
                            className={`rounded-xl px-3 py-2 text-xs font-black border transition ${
                                filter === "ALL"
                                    ? "border-black bg-black text-white"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            전체 {stats.total}
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilter("DRAFT")}
                            className={`rounded-xl px-3 py-2 text-xs font-black border transition ${
                                filter === "DRAFT"
                                    ? "border-black bg-black text-white"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            검수 중 {stats.draft}
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilter("CONFIRMED")}
                            className={`rounded-xl px-3 py-2 text-xs font-black border transition ${
                                filter === "CONFIRMED"
                                    ? "border-black bg-black text-white"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            확정 {stats.confirmed}
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilter("NEED_MAPPING")}
                            className={`rounded-xl px-3 py-2 text-xs font-black border transition ${
                                filter === "NEED_MAPPING"
                                    ? "border-black bg-black text-white"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            미매핑 {stats.needMappingCount}
                        </button>
                    </div>

                    <div className="text-xs text-gray-500">
                        미매핑 품목 {stats.needMappingCount}개 · 매핑 필요한 입고 {stats.needMappingInboundCount}건
                    </div>
                </div>

                {/* 리스트 */}
                <div className="mt-4">
                    {loading ? (
                        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-400 font-bold animate-pulse">
                            데이터 로드 중...
                        </div>
                    ) : filteredInbounds.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-400 font-bold">
                            표시할 입고 내역이 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredInbounds.map((inbound) => {
                                const items = inbound.items ?? [];
                                const totalItems = items.length;
                                const resolved = getResolvedCount(items);
                                const unresolved = Math.max(totalItems - resolved, 0);

                                const isConfirmed = inbound.status === "CONFIRMED";
                                const showMapping = !isConfirmed && totalItems > 0;

                                const dateText =
                                    // inboundDate가 응답에 추가됐다면 우선 표시(없으면 confirmedAt)
                                    formatDateOnly((inbound as any).inboundDate) !== "-"
                                        ? formatDateOnly((inbound as any).inboundDate)
                                        : formatDateOnly(inbound.confirmedAt);

                                return (
                                    <div
                                        key={inbound.inboundPublicId}
                                        onClick={() => handleRowClick(inbound.inboundPublicId)}
                                        className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="truncate text-sm font-black text-gray-900">
                                                        {inbound.vendorName || "거래처 미지정"}
                                                    </div>

                                                    <span
                                                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                                            isConfirmed
                                                                ? "bg-gray-50 text-gray-700 border-gray-200"
                                                                : "bg-amber-50 text-amber-700 border-amber-100"
                                                        }`}
                                                    >
                            {isConfirmed ? "CONFIRMED" : "DRAFT"}
                          </span>

                                                    {showMapping && unresolved > 0 && (
                                                        <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-red-50 text-red-700 border border-red-100">
                              미매핑 {unresolved}개
                            </span>
                                                    )}
                                                </div>

                                                <div className="mt-1 text-xs text-gray-500">
                                                    {dateText} · ID:{" "}
                                                    <span className="font-mono">{inbound.inboundPublicId.split("-")[0]}</span>
                                                </div>

                                                <div className="mt-3 text-sm text-gray-700">
                                                    <span className="font-bold text-gray-900">대표 품목</span>{" "}
                                                    <span>{getRepresentativeLabel(inbound)}</span>
                                                    {totalItems > 1 && (
                                                        <span className="ml-2 text-xs text-gray-400">외 {totalItems - 1}건</span>
                                                    )}
                                                </div>

                                                {showMapping && (
                                                    <div className="mt-3 text-xs text-gray-500">
                                                        매핑 진행: <span className="font-bold text-gray-900">{resolved}</span> / {totalItems}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <button
                                                    type="button"
                                                    className={`px-3 py-2 rounded-xl text-xs font-black transition border ${
                                                        isConfirmed
                                                            ? "bg-white border-gray-200 text-gray-700"
                                                            : unresolved > 0
                                                                ? "bg-black text-white border-black hover:bg-gray-900"
                                                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {isConfirmed ? "상세 보기" : unresolved > 0 ? "검수/매핑" : "검수 완료"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}