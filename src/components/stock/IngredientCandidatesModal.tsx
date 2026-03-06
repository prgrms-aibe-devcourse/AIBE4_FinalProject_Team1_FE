import { useState, useEffect } from 'react';
import type { Candidate, StockInboundItemResponse } from '@/types';

interface IngredientCandidatesModalProps {
    isOpen: boolean;
    item: StockInboundItemResponse | null;
    candidates: Candidate[];
    currentChosenId: string | null;
    onApply: (inboundItemPublicId: string, chosenIngredientPublicId: string) => void;
    onClose: () => void;
}

export default function IngredientCandidatesModal({
    isOpen,
    item,
    candidates,
    currentChosenId,
    onApply,
    onClose,
}: IngredientCandidatesModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(currentChosenId);

    useEffect(() => {
        setSelectedId(currentChosenId);
    }, [currentChosenId, item]);

    if (!isOpen || !item) return null;

    const handleApply = () => {
        if (!selectedId) return;
        onApply(item.inboundItemPublicId, selectedId);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-gray-50">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            재료 후보 선택
                        </p>
                        <h3 className="text-base font-black text-gray-800 leading-tight">
                            {item.rawProductName}
                        </h3>
                        {currentChosenId && (
                            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                                현재 선택:&nbsp;
                                {candidates.find((c) => c.ingredientPublicId === currentChosenId)
                                    ?.ingredientName ?? currentChosenId}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors mt-0.5"
                        aria-label="닫기"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                        >
                            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                        </svg>
                    </button>
                </div>

                {/* Candidate List */}
                <div className="px-6 py-4 overflow-y-auto max-h-72 space-y-2">
                    {candidates.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-8">
                            후보가 없습니다. 다시 후보 생성을 시도해보세요.
                        </p>
                    ) : (
                        candidates.map((c) => {
                            const isSelected = selectedId === c.ingredientPublicId;
                            return (
                                <label
                                    key={c.ingredientPublicId}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${isSelected
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-100 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="candidate"
                                        value={c.ingredientPublicId}
                                        checked={isSelected}
                                        onChange={() => setSelectedId(c.ingredientPublicId)}
                                        className="accent-indigo-600 w-4 h-4 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-800'
                                                }`}
                                        >
                                            {c.ingredientName}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            단위: {c.ingredientUnit || '-'}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.score >= 0.8
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : c.score >= 0.5
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {Math.round(c.score * 100)}%
                                    </span>
                                </label>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!selectedId}
                        className="flex-[2] py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-all"
                    >
                        선택 적용
                    </button>
                </div>
            </div>
        </div>
    );
}
