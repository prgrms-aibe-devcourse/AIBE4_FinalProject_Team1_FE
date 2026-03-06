import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ClipboardCheck,
    Save,
    CheckCircle,
    Search,
    AlertCircle,
    ChevronLeft,
    Download,
    Printer,
    Info
} from 'lucide-react';
import { requireStorePublicId } from '@/utils/store.ts';
import { getIngredients } from '@/api/reference/ingredient.ts';
import {
    createStockTakeSheet,
    confirmStockTakeSheet,
    getStockTakeSheetDetail,
    updateStockTakeDraftItems
} from '@/api/stock/stockTake';
import type {
    StockTakeItemRequest,
    StockTakeItemsDraftUpdateRequest
} from '@/types/stock/stockTake';

type ViewStockTakeItem = {
    ingredientPublicId: string;
    name: string;
    unit: string;
    stockTakeQty: number;
    theoreticalQty: number;
    varianceQty: number;
};

const StockTakePage: React.FC = () => {
    const navigate = useNavigate();
    const { sheetPublicId } = useParams<{ sheetPublicId?: string }>();

    const storePublicId = requireStorePublicId();

    const [status, setStatus] = useState<string>('DRAFT');
    const [title, setTitle] = useState<string>(`${new Date().toLocaleDateString()} 정기 재고 실사`);
    const [items, setItems] = useState<ViewStockTakeItem[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);

            try {
                if (sheetPublicId) {
                    const detail = await getStockTakeSheetDetail(storePublicId, sheetPublicId);

                    setTitle(detail.title ?? `${new Date().toLocaleDateString()} 정기 재고 실사`);
                    setStatus(detail.status ?? 'DRAFT');

                    const mappedItems: ViewStockTakeItem[] = (detail.items ?? []).map((item: any) => ({
                        ingredientPublicId: item.ingredientPublicId,
                        name: item.ingredientName ?? '',
                        unit: item.unit ?? '',
                        stockTakeQty: item.stockTakeQty ?? 0,
                        theoreticalQty: item.theoreticalQty ?? 0,
                        varianceQty: item.varianceQty ?? 0
                    }));

                    setItems(mappedItems);
                } else {
                    setStatus('DRAFT');
                    setTitle(`${new Date().toLocaleDateString()} 정기 재고 실사`);

                    const ingredients = await getIngredients(storePublicId);

                    const initialItems: ViewStockTakeItem[] = ingredients.map((ing: any) => ({
                        ingredientPublicId: ing.ingredientPublicId,
                        name: ing.name ?? '',
                        unit: ing.unit ?? '',
                        theoreticalQty: 0,
                        stockTakeQty: 0,
                        varianceQty: 0
                    }));

                    setItems(initialItems);
                }
            } catch (error) {
                console.error('데이터 로드 실패:', error);
                alert('정보를 불러오는 데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        initData();
    }, [storePublicId, sheetPublicId]);

    const summary = useMemo(() => {
        const total = items.length;
        const entered = items.filter((i) => (i.stockTakeQty ?? 0) > 0).length;
        const variance = items.reduce((acc, curr) => {
            const stockTakeQty = curr.stockTakeQty ?? 0;
            const theoreticalQty = curr.theoreticalQty ?? 0;
            return acc + (stockTakeQty - theoreticalQty);
        }, 0);

        return {
            total,
            entered,
            variance,
            progress: total > 0 ? (entered / total) * 100 : 0
        };
    }, [items]);

    const filteredItems = useMemo(() => {
        const keyword = searchTerm.toLowerCase();
        return items.filter((item) => (item.name ?? '').toLowerCase().includes(keyword));
    }, [items, searchTerm]);

    const handleQtyChange = (ingredientPublicId: string, value: string) => {
        if (status === 'CONFIRMED') return;

        const numVal = value === '' ? 0 : parseFloat(value);

        setItems((prev) =>
            prev.map((item) =>
                item.ingredientPublicId === ingredientPublicId
                    ? {
                        ...item,
                        stockTakeQty: Number.isNaN(numVal) ? 0 : numVal,
                        varianceQty: (Number.isNaN(numVal) ? 0 : numVal) - (item.theoreticalQty ?? 0)
                    }
                    : item
            )
        );
    };

    const handleSave = async () => {
        setIsProcessing(true);

        try {
            if (!sheetPublicId) {
                const requestItems: StockTakeItemRequest[] = items.map((i) => ({
                    ingredientPublicId: i.ingredientPublicId,
                    stockTakeQty: i.stockTakeQty
                }));

                const newSheetPublicId = await createStockTakeSheet(storePublicId, {
                    title,
                    items: requestItems
                });

                if (!newSheetPublicId) {
                    throw new Error('생성 응답에 sheetPublicId가 없습니다.');
                }

                alert('전표가 성공적으로 생성되었습니다.');
                navigate(`/stock/stocktakes/${newSheetPublicId}`, { replace: true });
            } else {
                const request: StockTakeItemsDraftUpdateRequest = {
                    items: items.map((i) => ({
                        ingredientPublicId: i.ingredientPublicId,
                        stockTakeQty: i.stockTakeQty
                    }))
                };

                await updateStockTakeDraftItems(storePublicId, sheetPublicId, request);
                setStatus('SAVED');
                alert('임시 저장이 완료되었습니다.');
            }
        } catch (e) {
            console.error('저장 오류:', e);
            alert('저장에 실패했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = async () => {
        if (!sheetPublicId) {
            alert('확정 전 임시 저장이 필요합니다.');
            return;
        }

        if (
            !window.confirm(
                '실사를 확정하시겠습니까? 확정 후에는 재고가 즉시 조정되며 수정할 수 없습니다.'
            )
        ) {
            return;
        }

        setIsProcessing(true);

        try {
            await confirmStockTakeSheet(storePublicId, sheetPublicId);
            setStatus('CONFIRMED');
            alert('재고 실사가 성공적으로 확정되었습니다.');
            navigate('/stock/stocktakes');
        } catch (e) {
            console.error('확정 오류:', e);
            alert('확정 처리에 실패했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/stock/stocktakes')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="h-6 w-px bg-slate-200" />

                        <div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={status === 'CONFIRMED'}
                                    className="text-lg font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-emerald-200 rounded px-1 transition-all"
                                />

                                <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${status === 'CONFIRMED'
                                            ? 'bg-blue-500 text-white'
                                            : status === 'SAVED'
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-amber-400 text-white'
                                        }`}
                                >
                                    {status === 'CONFIRMED'
                                        ? '확정됨'
                                        : status === 'SAVED'
                                            ? '저장됨'
                                            : '작성중'}
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 font-medium">
                                Store ID: {storePublicId.substring(0, 8)}...
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isProcessing || status === 'CONFIRMED'}
                            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
                        >
                            <Save size={18} className={isProcessing ? 'animate-spin' : ''} />
                            임시저장
                        </button>

                        <button
                            onClick={handleConfirm}
                            disabled={isProcessing || status === 'CONFIRMED'}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-lg shadow-slate-200 disabled:bg-slate-300"
                        >
                            <CheckCircle size={18} />
                            최종확정
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4" />
                        <p className="text-slate-500 font-medium">실사 정보를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <>
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    입력 현황
                                </p>

                                <div className="flex items-end justify-between">
                                    <h2 className="text-2xl font-black text-slate-800">
                                        {summary.entered}{' '}
                                        <span className="text-sm text-slate-400 font-medium">
                                            / {summary.total}
                                        </span>
                                    </h2>
                                    <div className="text-emerald-500 font-bold text-sm">
                                        {Math.round(summary.progress)}%
                                    </div>
                                </div>

                                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${summary.progress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 bg-slate-900 rounded-2xl p-5 shadow-xl flex items-center justify-between text-white">
                                <div>
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Info size={16} className="text-amber-400" />
                                        실사 가이드
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        1. 각 품목의 실제 수량을 입력하세요. 단위가 다른 품목은 개별 차이
                                        수량을 확인 바랍니다.
                                        <br />
                                        2. 입력 즉시 해당 품목의 장부 재고와의 차이가 실시간으로 계산됩니다.
                                        <br />
                                        3. 모든 품목 입력 후 상단의 &apos;최종확정&apos;을 눌러 조사를 완료해
                                        주세요.
                                    </p>
                                </div>

                                <div className="hidden lg:block opacity-20">
                                    <ClipboardCheck size={64} />
                                </div>
                            </div>
                        </section>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        size={18}
                                    />
                                    <input
                                        type="text"
                                        placeholder="품목명 또는 코드 검색..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200 transition outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition"
                                        title="엑셀 내보내기"
                                        type="button"
                                    >
                                        <Download size={20} />
                                    </button>
                                    <button
                                        className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition"
                                        title="인쇄"
                                        type="button"
                                    >
                                        <Printer size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                                            <th className="px-6 py-4">품목 정보</th>
                                            <th className="px-6 py-4 text-right">장부 재고 (A)</th>
                                            <th className="px-6 py-4 text-center w-40">실사 수량 (B)</th>
                                            <th className="px-6 py-4 text-right">차이 (B-A)</th>
                                            <th className="px-6 py-4 text-center">단위</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {filteredItems.length > 0 ? (
                                            filteredItems.map((item) => {
                                                const stockTakeQty = item.stockTakeQty ?? 0;
                                                const theoreticalQty = item.theoreticalQty ?? 0;
                                                const variance = stockTakeQty - theoreticalQty;
                                                const isDirty = stockTakeQty > 0;

                                                return (
                                                    <tr
                                                        key={item.ingredientPublicId}
                                                        className={`group hover:bg-slate-50/80 transition-colors ${status === 'CONFIRMED' ? 'opacity-60' : ''
                                                            }`}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-800 group-hover:text-blue-600 transition">
                                                                {item.name}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-medium">
                                                                CODE: {item.ingredientPublicId}
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-4 text-right font-mono text-sm text-slate-500">
                                                            {theoreticalQty.toFixed(2)}
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={stockTakeQty === 0 ? '' : stockTakeQty}
                                                                disabled={status === 'CONFIRMED'}
                                                                onChange={(e) =>
                                                                    handleQtyChange(
                                                                        item.ingredientPublicId,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className={`w-full py-2 px-3 text-center font-black text-lg rounded-xl border-2 transition-all outline-none ${isDirty
                                                                        ? 'border-blue-100 bg-blue-50 text-blue-700 focus:border-blue-400'
                                                                        : 'border-slate-100 bg-white focus:border-slate-300'
                                                                    } disabled:bg-slate-50 disabled:border-transparent`}
                                                                placeholder="0"
                                                            />
                                                        </td>

                                                        <td
                                                            className={`px-6 py-4 text-right font-mono font-bold text-sm ${!isDirty
                                                                    ? 'text-slate-200'
                                                                    : variance > 0
                                                                        ? 'text-blue-500'
                                                                        : variance < 0
                                                                            ? 'text-rose-500'
                                                                            : 'text-slate-400'
                                                                }`}
                                                        >
                                                            {isDirty
                                                                ? variance > 0
                                                                    ? `+${variance.toFixed(2)}`
                                                                    : variance.toFixed(2)
                                                                : '0.00'}
                                                        </td>

                                                        <td className="px-6 py-4 text-center">
                                                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                                                {item.unit || '-'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-6 py-20 text-center text-slate-400 italic font-medium"
                                                >
                                                    일치하는 품목이 없습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200">
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                                        총 입력 품목
                                    </p>
                                    <p className="font-bold">
                                        {summary.entered} / {summary.total}
                                    </p>
                                </div>

                                <div className="h-8 w-px bg-slate-100" />

                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                                        총 재고 차이
                                    </p>
                                    <p
                                        className={`font-bold ${summary.variance >= 0 ? 'text-blue-500' : 'text-rose-500'
                                            }`}
                                    >
                                        {summary.variance > 0
                                            ? `+${summary.variance.toFixed(2)}`
                                            : summary.variance.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                                <AlertCircle size={14} className="text-amber-500" />
                                최종 확정 시 실제 장부 재고가 업데이트됩니다. 이 작업은 되돌릴 수 없습니다.
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default StockTakePage;