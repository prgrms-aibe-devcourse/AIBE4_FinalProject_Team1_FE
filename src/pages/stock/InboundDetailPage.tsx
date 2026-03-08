import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { requireStorePublicId } from '@/utils/store';
import {
    fetchInboundDetail,
    confirmIngredientMapping,
    confirmInboundFinal,
} from '@/api/stock/inbound.ts';
import type {
    StockInboundResponse,
    StockInboundItemResponse,
    Candidate,
} from '@/types';
import UnifiedIngredientSelector from '@/components/stock/UnifiedIngredientSelector';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
    visible: boolean;
    message: string;
    type: ToastType;
}

type ConfirmIngredientPayload = {
    inboundItemPublicId: string;
    existingIngredientPublicId?: string;
    newIngredientName?: string;
    newIngredientUnit?: string;
};

type InboundDetailLocationState = {
    resolvedNormalizedKeyByItemId?: Record<string, string>;
};

function formatInboundNumber(value?: string | null) {
    if (!value) return '-';
    return value.substring(0, 8);
}

function formatDate(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatCurrency(value?: number | null) {
    if (value == null || Number.isNaN(value)) return '-';
    return `₩${Number(value).toLocaleString()}`;
}

function StatusBadge({ status }: { status: string | null }) {
    const map: Record<string, { label: string; cls: string }> = {
        AUTO_SUGGESTED: {
            label: '자동 추천',
            cls: 'bg-slate-100 text-slate-700 border-slate-200',
        },
        CONFIRMED: {
            label: '확정 완료',
            cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        FAILED: {
            label: '매핑 필요',
            cls: 'bg-rose-50 text-rose-700 border-rose-200',
        },
    };

    if (!status) {
        return (
            <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-500">
                미분석
            </span>
        );
    }

    const { label, cls } = map[status] ?? {
        label: status,
        cls: 'bg-gray-100 text-gray-500 border-gray-200',
    };

    return (
        <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-bold ${cls}`}>
            {label}
        </span>
    );
}

function getItemSuggestions(item: StockInboundItemResponse | null): Candidate[] {
    if (!item) return [];
    const maybeCandidates = (item as StockInboundItemResponse & { candidates?: Candidate[] }).candidates;
    return Array.isArray(maybeCandidates) ? maybeCandidates : [];
}

export default function InboundDetailPage() {
    const { inboundPublicId } = useParams<{ inboundPublicId: string }>();
    const storePublicId = requireStorePublicId();
    const navigate = useNavigate();
    const location = useLocation();

    const locationState = location.state as InboundDetailLocationState | null;

    const [inbound, setInbound] = useState<StockInboundResponse | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [loadingConfirmFinal, setLoadingConfirmFinal] = useState(false);
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState<StockInboundItemResponse | null>(null);

    const [resolvedNormalizedKeyByItemId] = useState<Record<string, string>>(
        () => locationState?.resolvedNormalizedKeyByItemId ?? {}
    );

    const [toast, setToast] = useState<ToastState>({
        visible: false,
        message: '',
        type: 'info',
    });

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ visible: true, message, type });
        window.setTimeout(() => {
            setToast((prev) => ({ ...prev, visible: false }));
        }, 3500);
    }, []);

    const loadDetail = useCallback(async () => {
        if (!storePublicId || typeof inboundPublicId !== 'string') return;

        try {
            setLoadingDetail(true);
            const data = await fetchInboundDetail(storePublicId, inboundPublicId);
            setInbound(data);
        } catch (error) {
            console.error(error);
            showToast('입고 상세를 불러오지 못했습니다.', 'error');
        } finally {
            setLoadingDetail(false);
        }
    }, [storePublicId, inboundPublicId, showToast]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    const counts = useMemo(() => {
        if (!inbound) return { suggested: 0, confirmed: 0, failed: 0 };

        return inbound.items.reduce(
            (acc, it) => {
                if (it.resolutionStatus === 'AUTO_SUGGESTED') acc.suggested++;
                else if (it.resolutionStatus === 'CONFIRMED') acc.confirmed++;
                else if (it.resolutionStatus === 'FAILED') acc.failed++;
                return acc;
            },
            { suggested: 0, confirmed: 0, failed: 0 }
        );
    }, [inbound]);

    const totalCost = useMemo(() => {
        if (!inbound) return 0;
        if (typeof inbound.totalCost === 'number') return inbound.totalCost;

        return inbound.items.reduce((sum, item) => {
            const quantity = Number(item.quantity ?? 0);
            const unitCost = Number(item.unitCost ?? 0);
            return sum + quantity * unitCost;
        }, 0);
    }, [inbound]);

    const itemCount = useMemo(() => {
        if (!inbound) return 0;
        if (typeof inbound.itemCount === 'number') return inbound.itemCount;
        return inbound.items.length;
    }, [inbound]);

    const handleOpenSelector = useCallback((item: StockInboundItemResponse) => {
        setModalItem(item);
        setModalOpen(true);
    }, []);

    const handleConfirmIngredient = useCallback(
        async (payload: ConfirmIngredientPayload) => {
            if (!storePublicId || typeof inboundPublicId !== 'string') return;

            try {
                setLoadingItemId(payload.inboundItemPublicId);

                await confirmIngredientMapping(
                    storePublicId,
                    inboundPublicId,
                    payload.inboundItemPublicId,
                    {
                        existingIngredientPublicId: payload.existingIngredientPublicId ?? null,
                        newIngredientName: payload.newIngredientName ?? null,
                        newIngredientUnit: payload.newIngredientUnit ?? null,
                    }
                );

                setModalOpen(false);
                setModalItem(null);
                showToast('재료가 확정되었습니다.', 'success');
                await loadDetail();
            } catch (error) {
                console.error(error);
                showToast('재료 확정에 실패했습니다.', 'error');
                throw error;
            } finally {
                setLoadingItemId(null);
            }
        },
        [storePublicId, inboundPublicId, showToast, loadDetail]
    );

    const handleConfirmInbound = useCallback(async () => {
        if (!storePublicId || typeof inboundPublicId !== 'string' || !inbound) return;

        if (counts.failed > 0) {
            showToast('매핑이 필요한 항목이 남아 있습니다. 해당 항목을 먼저 처리해주세요.', 'error');
            return;
        }

        const message =
            counts.suggested > 0
                ? `자동 추천 ${counts.suggested}건, 수동 확정 ${counts.confirmed}건을 포함해 입고를 최종 확정할까요?`
                : '입고를 최종 확정할까요?';

        const ok = window.confirm(message);
        if (!ok) return;

        try {
            setLoadingConfirmFinal(true);
            await confirmInboundFinal(storePublicId, inboundPublicId);
            showToast('입고가 최종 확정되었습니다.', 'success');
            await loadDetail();
        } catch (error: unknown) {
            console.error(error);

            let msg = '입고 확정 중 오류가 발생했습니다.';
            if (
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
            ) {
                msg = (error as { response?: { data?: { message?: string } } }).response!.data!.message!;
            }

            showToast(msg, 'error');
        } finally {
            setLoadingConfirmFinal(false);
        }
    }, [storePublicId, inboundPublicId, inbound, counts, showToast, loadDetail]);

    const toastBg: Record<ToastType, string> = {
        success: 'bg-emerald-600',
        error: 'bg-red-600',
        info: 'bg-gray-900',
    };

    if (loadingDetail) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="space-y-3 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
                    <p className="text-sm font-bold text-gray-400">데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (!inbound) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <p className="font-bold text-gray-400">입고 정보를 찾을 수 없습니다.</p>
            </div>
        );
    }

    const isConfirmedInbound = inbound.status === 'CONFIRMED';

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/stock/inbound')}
                            className="flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
                            </svg>
                            입고 목록
                        </button>
                        <span className="text-gray-300">/</span>
                        <div>
                            <div className="text-sm font-black text-gray-900">입고 상세</div>
                            <div className="text-xs font-mono text-gray-400">
                                입고번호 {formatInboundNumber(inbound.inboundPublicId)}
                            </div>
                        </div>
                    </div>

                    {!isConfirmedInbound && (
                        <button
                            onClick={handleConfirmInbound}
                            disabled={loadingConfirmFinal || counts.failed > 0}
                            className={`rounded-md px-5 py-2.5 text-sm font-black transition-colors ${
                                loadingConfirmFinal || counts.failed > 0
                                    ? 'cursor-not-allowed bg-gray-300 text-gray-600'
                                    : 'bg-gray-900 text-white hover:bg-black'
                            }`}
                        >
                            {loadingConfirmFinal ? '처리 중...' : '입고 최종 확정'}
                        </button>
                    )}
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-6 py-6">
                <section className="border border-gray-200 bg-white">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 px-6 py-5 md:grid-cols-3 xl:grid-cols-6">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">입고번호</p>
                            <p className="mt-2 font-mono text-sm font-bold text-gray-900">
                                {formatInboundNumber(inbound.inboundPublicId)}
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">거래처</p>
                            <p className="mt-2 text-sm font-bold text-gray-900">{inbound.vendorName ?? '거래처 미지정'}</p>
                        </div>

                        <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">입고일자</p>
                            <p className="mt-2 text-sm font-bold text-gray-900">{formatDate(inbound.inboundDate)}</p>
                        </div>

                        <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">품목 수</p>
                            <p className="mt-2 text-sm font-bold text-gray-900">{itemCount}건</p>
                        </div>

                        <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">확정일시</p>
                            <p className="mt-2 text-sm font-bold text-gray-900">{formatDateTime(inbound.confirmedAt)}</p>
                        </div>

                        <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">총 비용</p>
                            <p className="mt-2 text-sm font-bold text-gray-900">{formatCurrency(totalCost)}</p>
                        </div>
                    </div>

                    {inbound.confirmedByUserName && (
                        <div className="border-t border-gray-200 px-6 py-3 text-xs text-gray-500">
                            확정자 <span className="ml-1 font-semibold text-gray-700">{inbound.confirmedByUserName}</span>
                        </div>
                    )}
                </section>

                {!isConfirmedInbound && (
                    <section className="border border-gray-200 bg-white px-6 py-4">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                            <div className="text-gray-700">
                                자동 추천 <span className="ml-1 font-bold text-gray-900">{counts.suggested}건</span>
                            </div>
                            <div className="text-gray-700">
                                확정 완료 <span className="ml-1 font-bold text-gray-900">{counts.confirmed}건</span>
                            </div>
                            <div className="text-gray-700">
                                매핑 필요 <span className="ml-1 font-bold text-gray-900">{counts.failed}건</span>
                            </div>
                        </div>

                        {counts.failed > 0 && (
                            <p className="mt-3 text-xs font-medium text-rose-700">
                                매핑이 필요한 항목을 모두 처리해야 최종 확정이 가능합니다.
                            </p>
                        )}
                    </section>
                )}

                <section className="border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-sm font-black text-gray-900">
                            입고 품목
                            <span className="ml-2 text-xs font-bold text-gray-400">({itemCount}건)</span>
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-black uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="w-14 px-5 py-3">#</th>
                                <th className="px-4 py-3">품목명</th>
                                <th className="px-4 py-3">매핑 재료</th>
                                <th className="px-4 py-3 text-center">수량</th>
                                <th className="px-4 py-3 text-right">단가</th>
                                <th className="px-4 py-3 text-right">금액</th>
                                <th className="px-4 py-3 text-center">유통기한</th>
                                <th className="px-4 py-3 text-center">상태</th>
                                <th className="px-4 py-3 text-center">관리</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {inbound.items.map((item, idx) => {
                                const itemId = item.inboundItemPublicId;
                                const isLoadingThis = loadingItemId === itemId;
                                const resolvedNormalizedRawKey = resolvedNormalizedKeyByItemId[itemId];
                                const lineAmount = Number(item.quantity ?? 0) * Number(item.unitCost ?? 0);

                                let actionLabel = '재료 선택';
                                if (item.resolutionStatus === 'FAILED') actionLabel = '매핑';
                                else if (item.resolutionStatus === 'AUTO_SUGGESTED') actionLabel = '검토/수정';
                                else if (item.resolutionStatus === 'CONFIRMED') actionLabel = '수정';

                                return (
                                    <tr key={itemId} className="hover:bg-gray-50">
                                        <td className="px-5 py-4 font-mono text-xs text-gray-400">{idx + 1}</td>

                                        <td className="px-4 py-4">
                                            <div className="font-bold text-gray-900">{item.rawProductName}</div>
                                        </td>

                                        <td className="px-4 py-4">
                                            {item.ingredientName ? (
                                                <span className="font-bold text-gray-900">{item.ingredientName}</span>
                                            ) : resolvedNormalizedRawKey ? (
                                                <span className="font-bold text-gray-900">{resolvedNormalizedRawKey}</span>
                                            ) : item.normalizedRawKey ? (
                                                <span className="font-bold text-gray-900">{item.normalizedRawKey}</span>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>

                                        <td className="px-4 py-4 text-center font-bold text-gray-900">
                                            {item.quantity}
                                        </td>

                                        <td className="px-4 py-4 text-right text-gray-700">
                                            {formatCurrency(item.unitCost)}
                                        </td>

                                        <td className="px-4 py-4 text-right font-bold text-gray-900">
                                            {formatCurrency(lineAmount)}
                                        </td>

                                        <td className="px-4 py-4 text-center text-gray-700">
                                            {formatDate(item.expirationDate)}
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <StatusBadge status={item.resolutionStatus} />
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            {isConfirmedInbound ? (
                                                <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-500">
                                                        완료
                                                    </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleOpenSelector(item)}
                                                    disabled={isLoadingThis}
                                                    className={`rounded-md px-3 py-2 text-[11px] font-black transition-colors ${
                                                        isLoadingThis
                                                            ? 'cursor-not-allowed bg-gray-300 text-gray-600'
                                                            : 'bg-gray-900 text-white hover:bg-black'
                                                    }`}
                                                >
                                                    {isLoadingThis ? '처리 중...' : actionLabel}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                            <tfoot className="border-t border-gray-200 bg-gray-50">
                            <tr>
                                <td colSpan={5} className="px-4 py-4 text-right text-sm font-black text-gray-700">
                                    총 비용
                                </td>
                                <td className="px-4 py-4 text-right text-lg font-black text-gray-900">
                                    {formatCurrency(totalCost)}
                                </td>
                                <td colSpan={3} />
                            </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>
            </main>

            <UnifiedIngredientSelector
                isOpen={modalOpen}
                item={modalItem}
                suggestions={getItemSuggestions(modalItem)}
                onConfirm={handleConfirmIngredient}
                onClose={() => {
                    setModalOpen(false);
                    setModalItem(null);
                }}
            />

            <div
                className={`fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-2xl transition-all duration-500 ${
                    toastBg[toast.type]
                } ${toast.visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-10 opacity-0'}`}
            >
                {toast.message}
            </div>
        </div>
    );
}