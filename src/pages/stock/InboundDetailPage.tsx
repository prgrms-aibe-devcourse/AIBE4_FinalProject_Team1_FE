import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

function StatusBadge({ status }: { status: string | null }) {
    const map: Record<string, { label: string; cls: string }> = {
        AUTO_SUGGESTED: {
            label: '자동 추천',
            cls: 'bg-sky-50 text-sky-700 border-sky-200',
        },
        CONFIRMED: {
            label: '확정 완료',
            cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        FAILED: {
            label: '매핑 필요',
            cls: 'bg-red-50 text-red-700 border-red-200',
        },
    };

    if (!status) {
        return (
            <span className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border bg-gray-100 text-gray-500 border-gray-200">
                미분석
            </span>
        );
    }

    const { label, cls } = map[status] ?? {
        label: status,
        cls: 'bg-gray-100 text-gray-500 border-gray-200',
    };

    return (
        <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${cls}`}>
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

    const [inbound, setInbound] = useState<StockInboundResponse | null>(null);

    const [loadingDetail, setLoadingDetail] = useState(true);
    const [loadingConfirmFinal, setLoadingConfirmFinal] = useState(false);
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState<StockInboundItemResponse | null>(null);

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

        const inboundId: string = inboundPublicId;

        try {
            setLoadingDetail(true);
            const data = await fetchInboundDetail(storePublicId, inboundId);
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

    const handleOpenSelector = useCallback((item: StockInboundItemResponse) => {
        setModalItem(item);
        setModalOpen(true);
    }, []);

    const handleConfirmIngredient = useCallback(
        async (payload: ConfirmIngredientPayload) => {
            if (!storePublicId || typeof inboundPublicId !== 'string') return;

            const inboundId: string = inboundPublicId;

            try {
                setLoadingItemId(payload.inboundItemPublicId);

                await confirmIngredientMapping(
                    storePublicId,
                    inboundId,
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

        const inboundId: string = inboundPublicId;

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
            await confirmInboundFinal(storePublicId, inboundId);
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
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-bold text-gray-400">데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (!inbound) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <p className="text-gray-400 font-bold">입고 정보를 찾을 수 없습니다.</p>
            </div>
        );
    }

    const isConfirmedInbound = inbound.status === 'CONFIRMED';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/stock/inbound')}
                            className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
                            </svg>
                            입고 목록
                        </button>
                        <span className="text-gray-300">/</span>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-gray-900">입고 상세</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleConfirmInbound}
                            disabled={loadingConfirmFinal || isConfirmedInbound || counts.failed > 0}
                            className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all ${
                                loadingConfirmFinal || isConfirmedInbound || counts.failed > 0
                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-900'
                            }`}
                        >
                            {loadingConfirmFinal ? '처리 중...' : '입고 최종 확정'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-6 w-full space-y-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">공급처</p>
                                <p className="text-sm font-bold text-gray-800">{inbound.vendorName ?? '미지정'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">입고 ID</p>
                                <p className="text-xs font-mono text-gray-500 truncate">{inbound.inboundPublicId}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">상태</p>
                                <span
                                    className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                                        isConfirmedInbound
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-amber-50 text-amber-700'
                                    }`}
                                >
                                    {isConfirmedInbound ? '입고 완료' : '검수 대기'}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">확정일시</p>
                                <p className="text-xs text-gray-500">{inbound.confirmedAt ? inbound.confirmedAt.split('T')[0] : '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col justify-center gap-3">
                        <div className="flex items-center justify-between text-[11px] font-black">
                            <span className="text-gray-400">자동 추천</span>
                            <span className="text-sky-600">{counts.suggested}건</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-black">
                            <span className="text-gray-400">확정 완료</span>
                            <span className="text-emerald-600">{counts.confirmed}건</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-black">
                            <span className="text-gray-400">매핑 필요</span>
                            <span className="text-rose-600">{counts.failed}건</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-800">
                            입고 품목 목록
                            <span className="ml-2 text-xs font-bold text-gray-400">({inbound.items.length}건)</span>
                        </h2>
                        {counts.failed > 0 && !isConfirmedInbound && (
                            <p className="text-[11px] text-rose-600 font-black italic">
                                매핑이 필요한 항목을 모두 처리해야 최종 확정이 가능합니다.
                            </p>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3 w-5">#</th>
                                <th className="px-4 py-3">품목명</th>
                                <th className="px-4 py-3">매핑 재료</th>
                                <th className="px-4 py-3 text-center">수량</th>
                                <th className="px-4 py-3 text-right">단가</th>
                                <th className="px-4 py-3 text-center">유통기한</th>
                                <th className="px-4 py-3 text-center">상태</th>
                                <th className="px-4 py-3 text-center">관리</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {inbound.items.map((item, idx) => {
                                const itemId = item.inboundItemPublicId;
                                const isLoadingThis = loadingItemId === itemId;

                                let actionLabel = '재료 선택';
                                if (item.resolutionStatus === 'FAILED') actionLabel = '매핑';
                                else if (item.resolutionStatus === 'AUTO_SUGGESTED') actionLabel = '검토/수정';
                                else if (item.resolutionStatus === 'CONFIRMED') actionLabel = '수정';

                                return (
                                    <tr key={itemId} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-5 py-4 text-gray-400 font-mono">{idx + 1}</td>

                                        <td className="px-4 py-4">
                                            <div className="font-bold text-gray-800">{item.rawProductName}</div>
                                        </td>

                                        <td className="px-4 py-4">
                                            {item.ingredientName ? (
                                                <span className="font-bold">
                                                        {item.ingredientName}
                                                    </span>
                                            ) : item.normalizedRawKey ? (
                                                <span className="font-bold">{item.normalizedRawKey}</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>

                                        <td className="px-4 py-4 text-center font-bold text-gray-700">{item.quantity}</td>
                                        <td className="px-4 py-4 text-right text-gray-500">
                                            {item.unitCost != null ? `₩${Number(item.unitCost).toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600">
                                                    {item.expirationDate ? item.expirationDate.split('T')[0] : '-'}
                                                </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <StatusBadge status={item.resolutionStatus} />
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {isConfirmedInbound ? (
                                                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                                                        완료
                                                    </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleOpenSelector(item)}
                                                    disabled={isLoadingThis}
                                                    className={`px-3 py-1.5 text-[11px] font-bold text-white rounded-lg transition-all shadow-sm ${
                                                        item.resolutionStatus === 'FAILED'
                                                            ? 'bg-rose-600 hover:bg-rose-700'
                                                            : item.resolutionStatus === 'CONFIRMED'
                                                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                                                : 'bg-indigo-600 hover:bg-indigo-700'
                                                    } disabled:bg-gray-300`}
                                                >
                                                    {isLoadingThis ? '...' : actionLabel}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
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
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-bold transition-all duration-500 ${
                    toastBg[toast.type]
                } ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            >
                {toast.message}
            </div>
        </div>
    );
}