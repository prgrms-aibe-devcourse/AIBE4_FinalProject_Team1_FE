import { useEffect, useMemo, useState } from 'react';
import type { Candidate, StockInboundItemResponse, IngredientResponse } from '@/types';
import { getIngredients } from '@/api/reference/ingredient';
import { requireStorePublicId } from '@/utils/store';

type IngredientUnit = NonNullable<IngredientResponse['unit']>;

type ConfirmIngredientPayload = {
    inboundItemPublicId: string;
    existingIngredientPublicId?: string;
    newIngredientName?: string;
    newIngredientUnit?: IngredientUnit;
};

interface UnifiedIngredientSelectorProps {
    isOpen: boolean;
    item: StockInboundItemResponse | null;
    suggestions: Candidate[];
    onConfirm: (payload: ConfirmIngredientPayload) => Promise<void>;
    onClose: () => void;
}

export default function UnifiedIngredientSelector({
                                                      isOpen,
                                                      item,
                                                      suggestions,
                                                      onConfirm,
                                                      onClose,
                                                  }: UnifiedIngredientSelectorProps) {
    const storePublicId = requireStorePublicId();

    const [searchQuery, setSearchQuery] = useState('');
    const [allIngredients, setAllIngredients] = useState<IngredientResponse[]>([]);
    const [loadingIngredients, setLoadingIngredients] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [createUnit, setCreateUnit] = useState<IngredientUnit>('EA');

    useEffect(() => {
        if (!isOpen || !storePublicId || !item) return;

        setLoadingIngredients(true);
        getIngredients(storePublicId)
            .then(setAllIngredients)
            .catch(console.error)
            .finally(() => setLoadingIngredients(false));

        setSearchQuery(item.ingredientName?.trim() || item.rawProductName || '');
        setCreateUnit('EA');
    }, [isOpen, storePublicId, item]);

    const availableUnits = useMemo<IngredientUnit[]>(() => {
        const units = allIngredients
            .map((ing) => ing.unit)
            .filter((unit): unit is IngredientUnit => unit != null);

        return Array.from(new Set<IngredientUnit>(['EA', ...units]));
    }, [allIngredients]);

    const filteredIngredients = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return allIngredients.slice(0, 10);
        }

        const tokens = query.split(/\s+/).filter(Boolean);

        return allIngredients
            .filter((ing) => {
                const name = ing.name.toLowerCase();
                return tokens.every((token) => name.includes(token));
            })
            .sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();

                const aRank = aName === query ? 2 : aName.startsWith(query) ? 1 : 0;
                const bRank = bName === query ? 2 : bName.startsWith(query) ? 1 : 0;

                if (aRank !== bRank) return bRank - aRank;
                return a.name.localeCompare(b.name, 'ko');
            })
            .slice(0, 10);
    }, [searchQuery, allIngredients]);

    const exactNameExists = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return false;
        return allIngredients.some((ing) => ing.name.trim().toLowerCase() === query);
    }, [allIngredients, searchQuery]);

    const handleSelectExisting = async (ingredientPublicId: string) => {
        if (!item || submitting) return;

        try {
            setSubmitting(true);
            await onConfirm({
                inboundItemPublicId: item.inboundItemPublicId,
                existingIngredientPublicId: ingredientPublicId,
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('재료 확정에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateNew = async () => {
        if (!item || !storePublicId || !searchQuery.trim() || submitting) return;

        try {
            setSubmitting(true);
            await onConfirm({
                inboundItemPublicId: item.inboundItemPublicId,
                newIngredientName: searchQuery.trim(),
                newIngredientUnit: createUnit,
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('새 재료 생성 및 확정에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-start justify-between">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                            재료 선택 / 생성
                        </p>
                        <h3 className="text-sm font-black text-gray-800 truncate">{item.rawProductName}</h3>
                        <div className="mt-2 text-xs text-gray-500">
                            현재 매핑:
                            <span className="ml-1 font-bold text-gray-800">
                                {item.ingredientName ?? '미매핑'}
                            </span>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {suggestions.length > 0 && (
                        <div>
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-tighter mb-2">
                                자동 추천 결과
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {suggestions.map((s) => (
                                    <button
                                        key={s.ingredientPublicId}
                                        onClick={() => handleSelectExisting(s.ingredientPublicId)}
                                        disabled={submitting}
                                        className="flex items-center justify-between p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-indigo-900">{s.ingredientName}</p>
                                            <p className="text-[10px] text-indigo-400">
                                                신뢰도: {Math.round(s.score * 100)}%
                                            </p>
                                        </div>
                                        <div className="text-[10px] font-black text-white bg-indigo-500 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            선택하기
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-tighter mb-2">
                            재료 검색
                        </h4>

                        <div className="relative mb-3">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="재료명을 입력하세요..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all pr-10"
                            />
                            <div className="absolute right-3 top-3.5 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {loadingIngredients ? (
                                <div className="text-center py-4 text-xs text-gray-400 italic">
                                    재료 목록을 불러오는 중...
                                </div>
                            ) : filteredIngredients.length > 0 ? (
                                filteredIngredients.map((ing) => (
                                    <button
                                        key={ing.ingredientPublicId}
                                        onClick={() => handleSelectExisting(ing.ingredientPublicId)}
                                        disabled={submitting}
                                        className="w-full flex items-center justify-between p-3 rounded-xl transition-all group border border-transparent hover:bg-gray-50 hover:border-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-gray-800">{ing.name}</p>
                                            <p className="text-[10px] text-gray-400">단위: {ing.unit}</p>
                                        </div>
                                        <div className="text-[10px] font-black text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            선택
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-center">
                                    <p className="text-xs text-orange-700 font-medium italic">일치하는 재료가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {searchQuery.trim() && !exactNameExists && (
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <div className="mb-3">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">
                                    새 재료 빠른 생성
                                </h4>
                                <p className="mt-1 text-xs text-gray-500">
                                    검색 결과에 원하는 재료가 없으면 새 재료를 만들고 바로 확정합니다.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px]">
                                <div>
                                    <label className="text-[11px] font-black text-gray-500">재료명</label>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-black text-gray-500">단위</label>
                                    <select
                                        value={createUnit}
                                        onChange={(e) => setCreateUnit(e.target.value as IngredientUnit)}
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {availableUnits.map((unit) => (
                                            <option key={unit} value={unit}>
                                                {unit}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateNew}
                                disabled={submitting || !searchQuery.trim()}
                                className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all ${
                                    submitting || !searchQuery.trim()
                                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                        : 'bg-black text-white hover:bg-gray-900'
                                }`}
                            >
                                {submitting ? '처리 중...' : `'${searchQuery.trim()}' 새 재료로 생성 후 확정`}
                            </button>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-medium">
                        선택 또는 생성 즉시 해당 품목의 재료가 확정됩니다.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[11px] font-black text-gray-500 hover:bg-gray-200 rounded-lg transition-all"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}