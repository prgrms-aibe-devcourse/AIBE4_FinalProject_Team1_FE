import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requireStorePublicId } from '@/utils/store';
import {
    fetchInboundDetail,
    resolveAllIngredients,
    resolveSingleItem,
    bulkConfirmIngredients,
    normalizeAllProductNames,
    confirmInboundFinal,
} from '@/api/stock/inbound.ts';
import type {
    StockInboundResponse,
    StockInboundItemResponse,
    BulkResolveResponse,
    Candidate,
} from '@/types';
import IngredientCandidatesModal from '@/components/stock/IngredientCandidatesModal';

// ── Toast state type ────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface ToastState {
    visible: boolean;
    message: string;
    type: ToastType;
}

// ── StatusBadge component ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        CONFIRMED: { label: 'Confirmed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        AUTO_RESOLVED: { label: 'Auto-Resolved', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
        PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
        FAILED: { label: 'Failed', cls: 'bg-red-50 text-red-700 border-red-200' },
        UNRESOLVED: { label: 'Unresolved', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
    };
    const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
    return (
        <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${cls}`}>
            {label}
        </span>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InboundDetailPage() {
    const { inboundPublicId } = useParams<{ inboundPublicId: string }>();
    const storePublicId = requireStorePublicId();
    const navigate = useNavigate();

    // ── Core state ────────────────────────────────────────────────────────────
    const [inbound, setInbound] = useState<StockInboundResponse | null>(null);
    const [resolveAllSummary, setResolveAllSummary] = useState<BulkResolveResponse | null>(null);

    // candidatesCache: per-item candidate list fetched from server
    const [candidatesCache, setCandidatesCache] = useState<Record<string, Candidate[]>>({});

    // selectedMap: user's local choice per inboundItemPublicId -> chosenIngredientPublicId
    const [selectedMap, setSelectedMap] = useState<Record<string, string>>({});

    // ── Loading flags ─────────────────────────────────────────────────────────
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [loadingResolveAll, setLoadingResolveAll] = useState(false);
    const [loadingBulkConfirm, setLoadingBulkConfirm] = useState(false);
    const [loadingConfirmFinal, setLoadingConfirmFinal] = useState(false);
    const [loadingNormalize, setLoadingNormalize] = useState(false);
    // per-item loading when fetching single-item candidates
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

    // ── Modal state ───────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState<StockInboundItemResponse | null>(null);

    // ── Toast ─────────────────────────────────────────────────────────────────
    const [toast, setToast] = useState<ToastState>({
        visible: false,
        message: '',
        type: 'info',
    });

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
    };

    // ── Load detail ───────────────────────────────────────────────────────────
    const loadDetail = useCallback(async () => {
        if (!storePublicId || !inboundPublicId) return;
        try {
            setLoadingDetail(true);
            const data = await fetchInboundDetail(storePublicId, inboundPublicId);
            setInbound(data);

            // Auto-select when exactly 1 candidate exists in cache for an item that has PENDING/AUTO_RESOLVED
            // (populated on resolveAll or single resolve – done lazily below)
        } catch {
            showToast('입고 상세를 불러오지 못했습니다.', 'error');
        } finally {
            setLoadingDetail(false);
        }
    }, [storePublicId, inboundPublicId]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    // ── Auto-select helper: if candidatesCache updated, auto-fill single-candidate items ──
    const autoSelectSingleCandidates = useCallback(
        (newCache: Record<string, Candidate[]>) => {
            setSelectedMap((prev) => {
                const next = { ...prev };
                Object.entries(newCache).forEach(([itemId, candidates]) => {
                    if (candidates.length === 1 && !next[itemId]) {
                        next[itemId] = candidates[0].ingredientPublicId;
                    }
                });
                return next;
            });
        },
        []
    );

    // ── Resolve ALL ───────────────────────────────────────────────────────────
    const handleResolveAll = async () => {
        if (!storePublicId || !inboundPublicId) return;
        try {
            setLoadingResolveAll(true);
            const summary = await resolveAllIngredients(storePublicId, inboundPublicId);
            setResolveAllSummary(summary);
            showToast(
                `후보 생성 완료: 자동확정 ${summary.autoResolvedCount}, 선택필요 ${summary.pendingCount}, 실패 ${summary.failedCount}`,
                'success'
            );
            // Refresh item list so we get updated resolutionStatus
            await loadDetail();
        } catch {
            showToast('전체 후보 생성에 실패했습니다.', 'error');
        } finally {
            setLoadingResolveAll(false);
        }
    };

    // ── Normalize product names ───────────────────────────────────────────────
    const handleNormalizeAll = async () => {
        if (!storePublicId || !inboundPublicId) return;
        try {
            setLoadingNormalize(true);
            const res = await normalizeAllProductNames(storePublicId, inboundPublicId);
            showToast(
                `상품명 정규화 완료: ${res.normalizedCount}건 처리, ${res.failedCount}건 실패`,
                'success'
            );
            await loadDetail();
        } catch {
            showToast('상품명 정규화에 실패했습니다.', 'error');
        } finally {
            setLoadingNormalize(false);
        }
    };

    // ── Open candidate modal ──────────────────────────────────────────────────
    const handleOpenCandidates = async (item: StockInboundItemResponse) => {
        const itemId = item.inboundItemPublicId;

        // If already cached, open immediately
        if (candidatesCache[itemId] !== undefined) {
            setModalItem(item);
            setModalOpen(true);
            return;
        }

        // Otherwise fetch single-item resolve
        if (!storePublicId || !inboundPublicId) return;
        try {
            setLoadingItemId(itemId);
            const res = await resolveSingleItem(storePublicId, inboundPublicId, itemId);
            const candidates = res.candidates ?? [];
            const newCache = { ...candidatesCache, [itemId]: candidates };
            setCandidatesCache(newCache);
            autoSelectSingleCandidates({ [itemId]: candidates });

            setModalItem(item);
            setModalOpen(true);
        } catch {
            showToast('후보 정보를 불러오지 못했습니다.', 'error');
        } finally {
            setLoadingItemId(null);
        }
    };

    // ── Apply candidate selection from modal ──────────────────────────────────
    const handleApplySelection = (itemPublicId: string, chosenId: string) => {
        setSelectedMap((prev) => ({ ...prev, [itemPublicId]: chosenId }));
    };

    // ── Bulk confirm ──────────────────────────────────────────────────────────
    const pendingItems = Object.entries(selectedMap).filter(([, v]) => !!v);

    const handleBulkConfirm = async () => {
        if (!storePublicId || !inboundPublicId || pendingItems.length === 0) return;
        try {
            setLoadingBulkConfirm(true);
            const payload = {
                items: pendingItems.map(([inboundItemPublicId, chosenIngredientPublicId]) => ({
                    inboundItemPublicId,
                    chosenIngredientPublicId,
                })),
            };
            const res = await bulkConfirmIngredients(storePublicId, inboundPublicId, payload);
            if (res.failedCount > 0) {
                showToast(
                    `일괄 확정: ${res.successCount}건 성공, ${res.failedCount}건 실패`,
                    'error'
                );
            } else {
                showToast(`${res.successCount}건 재료 매핑이 확정되었습니다.`, 'success');
            }
            setSelectedMap({});
            await loadDetail();
        } catch {
            showToast('일괄 확정 처리 중 오류가 발생했습니다.', 'error');
            await loadDetail();
        } finally {
            setLoadingBulkConfirm(false);
        }
    };

    // ── Final inbound confirm ─────────────────────────────────────────────────
    const allConfirmed =
        !!inbound &&
        inbound.items.length > 0 &&
        inbound.items.every((it) => it.resolutionStatus === 'CONFIRMED');

    const handleConfirmInbound = async () => {
        if (!storePublicId || !inboundPublicId) return;
        try {
            setLoadingConfirmFinal(true);
            await confirmInboundFinal(storePublicId, inboundPublicId);
            showToast('입고가 최종 확정되었습니다.', 'success');
            await loadDetail();
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showToast(
                msg ?? '미확정 항목이 남아 있어 입고를 확정할 수 없습니다.',
                'error'
            );
        } finally {
            setLoadingConfirmFinal(false);
        }
    };

    // ── Toast color helper ─────────────────────────────────────────────────────
    const toastBg: Record<ToastType, string> = {
        success: 'bg-emerald-600',
        error: 'bg-red-600',
        info: 'bg-gray-900',
    };

    // ── Render ────────────────────────────────────────────────────────────────
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Sticky top bar ── */}
            <div className="sticky top-0 z-30 bg-[#1a1a1a] text-white shadow-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Left: title & breadcrumb */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/stock/inbound')}
                            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
                            </svg>
                            입고 목록
                        </button>
                        <span className="text-gray-600">/</span>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#1a1a1a" viewBox="0 0 256 256">
                                    <path d="M240,114.79V208a16,16,0,0,1-16,16H32a16,16,0,0,1-16-16V114.79a16,16,0,0,1,5.17-11.72l96-88.15a16,16,0,0,1,21.66,0l96,88.15A16,16,0,0,1,240,114.79Z" />
                                </svg>
                            </div>
                            <span className="font-bold text-sm">입고 상세</span>
                        </div>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResolveAll}
                            disabled={loadingResolveAll || inbound.status === 'CONFIRMED'}
                            className="px-4 py-2 text-xs font-bold bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-all"
                        >
                            {loadingResolveAll ? '생성 중...' : '전체 후보 생성'}
                        </button>
                        <button
                            onClick={handleNormalizeAll}
                            disabled={loadingNormalize || inbound.status === 'CONFIRMED'}
                            className="px-4 py-2 text-xs font-bold bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-all"
                        >
                            {loadingNormalize ? '처리 중...' : '전체 상품명 정규화'}
                        </button>
                        <div className="w-px h-6 bg-gray-700 mx-1" />
                        <button
                            onClick={handleBulkConfirm}
                            disabled={loadingBulkConfirm || pendingItems.length === 0 || inbound.status === 'CONFIRMED'}
                            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-all"
                        >
                            {loadingBulkConfirm
                                ? '확정 중...'
                                : `일괄 확정${pendingItems.length > 0 ? ` (${pendingItems.length})` : ''}`}
                        </button>
                        <button
                            onClick={handleConfirmInbound}
                            disabled={loadingConfirmFinal || !allConfirmed || inbound.status === 'CONFIRMED'}
                            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-all shadow-md"
                        >
                            {loadingConfirmFinal ? '확정 중...' : '입고 확정'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* ── Inbound header info ── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
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
                                className={`text-xs font-black px-2.5 py-1 rounded-lg ${inbound.status === 'CONFIRMED'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                    }`}
                            >
                                {inbound.status === 'CONFIRMED' ? '입고 완료' : '검수 대기'}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">확정일시</p>
                            <p className="text-xs text-gray-500">
                                {inbound.confirmedAt ? inbound.confirmedAt.split('T')[0] : '-'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── resolveAll summary strip ── */}
                {resolveAllSummary && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 flex flex-wrap gap-6 text-xs font-bold text-indigo-700">
                        <span>전체 {resolveAllSummary.totalCount}건</span>
                        <span className="text-emerald-600">자동확정 {resolveAllSummary.autoResolvedCount}</span>
                        <span className="text-amber-600">선택필요 {resolveAllSummary.pendingCount}</span>
                        <span className="text-red-600">실패 {resolveAllSummary.failedCount}</span>
                        <span className="text-gray-400">건너뜀 {resolveAllSummary.skippedCount}</span>
                    </div>
                )}

                {/* ── Items table ── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-800">
                            입고 품목 목록
                            <span className="ml-2 text-xs font-bold text-gray-400">({inbound.items.length}건)</span>
                        </h2>
                        {!allConfirmed && inbound.status !== 'CONFIRMED' && (
                            <p className="text-[11px] text-amber-600 font-semibold">
                                모든 항목을 확정해야 입고 확정이 활성화됩니다.
                            </p>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 w-5">#</th>
                                    <th className="px-4 py-3">원문 품목명</th>
                                    <th className="px-4 py-3 text-center">수량</th>
                                    <th className="px-4 py-3 text-right">단가</th>
                                    <th className="px-4 py-3 text-center">유통기한</th>
                                    <th className="px-4 py-3 text-center">정규화 상태</th>
                                    <th className="px-4 py-3">확정 재료</th>
                                    <th className="px-4 py-3 text-center">액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {inbound.items.map((item, idx) => {
                                    const itemId = item.inboundItemPublicId;
                                    const chosen = selectedMap[itemId]; // local selection
                                    const cachedCandidates = candidatesCache[itemId];
                                    const isLoadingThis = loadingItemId === itemId;

                                    // Display chosen ingredient name
                                    const chosenName = chosen
                                        ? cachedCandidates?.find((c) => c.ingredientPublicId === chosen)?.ingredientName
                                        : null;

                                    const displayIngredient = item.ingredientName ?? chosenName ?? null;

                                    const autoSingle =
                                        cachedCandidates?.length === 1 && !chosen;

                                    return (
                                        <tr
                                            key={itemId}
                                            className="hover:bg-gray-50/60 transition-colors group"
                                        >
                                            <td className="px-5 py-4 text-gray-400 font-mono">{idx + 1}</td>

                                            {/* rawProductName */}
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-gray-800 leading-snug">{item.rawProductName}</p>
                                                {item.specText && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{item.specText}</p>
                                                )}
                                            </td>

                                            {/* quantity */}
                                            <td className="px-4 py-4 text-center font-bold text-gray-700">
                                                {item.quantity}
                                            </td>

                                            {/* unitCost */}
                                            <td className="px-4 py-4 text-right text-gray-500">
                                                {item.unitCost != null ? `₩${Number(item.unitCost).toLocaleString()}` : '-'}
                                            </td>

                                            {/* expirationDate */}
                                            <td className="px-4 py-4 text-center">
                                                {item.expirationDate ? (
                                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600">
                                                        {item.expirationDate.split('T')[0]}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 italic text-[11px]">미입력</span>
                                                )}
                                            </td>

                                            {/* resolutionStatus badge */}
                                            <td className="px-4 py-4 text-center">
                                                <StatusBadge status={item.resolutionStatus} />
                                                {chosen && item.resolutionStatus !== 'CONFIRMED' && (
                                                    <div className="mt-1 text-[9px] font-bold text-indigo-500 uppercase">
                                                        선택됨
                                                    </div>
                                                )}
                                            </td>

                                            {/* confirmed ingredient name */}
                                            <td className="px-4 py-4">
                                                {item.resolutionStatus === 'CONFIRMED' ? (
                                                    <span className="font-bold text-emerald-700 text-xs">{item.ingredientName}</span>
                                                ) : chosen ? (
                                                    <span className="font-semibold text-indigo-700 text-xs">
                                                        {chosenName ?? chosen}
                                                    </span>
                                                ) : displayIngredient ? (
                                                    <span className="text-gray-500 text-xs">{displayIngredient}</span>
                                                ) : (
                                                    <span className="text-gray-300 italic text-[11px]">미선택</span>
                                                )}
                                            </td>

                                            {/* action */}
                                            <td className="px-4 py-4 text-center">
                                                {item.resolutionStatus === 'CONFIRMED' ? (
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                        확정완료
                                                    </span>
                                                ) : autoSingle ? (
                                                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-lg">
                                                        자동 선택됨
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenCandidates(item)}
                                                        disabled={isLoadingThis}
                                                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 rounded-lg transition-all shadow-sm"
                                                    >
                                                        {isLoadingThis ? '로딩...' : chosen ? '후보 재선택' : '후보 보기'}
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
            </div>

            {/* ── Candidate modal ── */}
            <IngredientCandidatesModal
                isOpen={modalOpen}
                item={modalItem}
                candidates={modalItem ? (candidatesCache[modalItem.inboundItemPublicId] ?? []) : []}
                currentChosenId={modalItem ? (selectedMap[modalItem.inboundItemPublicId] ?? null) : null}
                onApply={handleApplySelection}
                onClose={() => setModalOpen(false)}
            />

            {/* ── Toast ── */}
            <div
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-bold transition-all duration-500 ${toastBg[toast.type]
                    } ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            >
                {toast.type === 'success' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                    </svg>
                )}
                {toast.type === 'error' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z" />
                    </svg>
                )}
                <span>{toast.message}</span>
            </div>
        </div>
    );
}
