import React, { useEffect, useMemo, useState } from 'react';
import {
    Search,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    AlertCircle,
    Save,
    X,
} from 'lucide-react';
import {
    getIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
} from '@/api/reference/ingredient.ts';
import type {
    IngredientResponse,
    IngredientUnit,
    IngredientStatus,
} from '@/types/reference/ingredient';
import { requireStorePublicId } from '@/utils/store.ts';

const INGREDIENT_UNITS: IngredientUnit[] = ['EA', 'G', 'ML'];
const INGREDIENT_STATUS: IngredientStatus[] = ['ACTIVE', 'INACTIVE'];
const PAGE_SIZE = 10;

const UNIT_LABELS: Record<IngredientUnit, string> = {
    EA: '개(EA)',
    G: 'g',
    ML: 'ml',
};

const StatusBadge = ({ status }: { status: IngredientStatus }) => {
    const styles: Record<IngredientStatus, string> = {
        ACTIVE: 'bg-green-50 text-green-700 border border-green-200',
        INACTIVE: 'bg-blue-50 text-blue-700 border border-blue-200',
    };

    const labels: Record<IngredientStatus, string> = {
        ACTIVE: '활성',
        INACTIVE: '비활성',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

export default function IngredientPage() {
    const storePublicId = requireStorePublicId();

    const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
    const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
    const [currentIngredient, setCurrentIngredient] = useState<IngredientResponse | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [hasNext, setHasNext] = useState(false);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm.trim());
            setPage(0);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [searchTerm]);

    const loadIngredients = async (targetPage = page, targetKeyword = debouncedSearchTerm) => {
        setIsLoading(true);
        try {
            const data = await getIngredients(storePublicId, {
                page: targetPage,
                size: PAGE_SIZE,
                name: targetKeyword || undefined,
            });

            setIngredients(data.content);
            setPage(data.page);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
            setHasNext(data.hasNext);
        } catch (error) {
            console.error('Failed to load ingredients:', error);
            alert('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadIngredients(page, debouncedSearchTerm);
    }, [page, debouncedSearchTerm]);

    const pageLabel = useMemo(() => {
        if (totalElements === 0) {
            return '검색 결과 없음';
        }

        const start = page * PAGE_SIZE + 1;
        const end = Math.min((page + 1) * PAGE_SIZE, totalElements);
        return `${start}-${end} / 총 ${totalElements}개`;
    }, [page, totalElements]);

    const handleCreate = async (newData: {
        name: string;
        unit: IngredientUnit;
        lowStockThreshold: number | null;
    }) => {
        try {
            await createIngredient(storePublicId, newData);
            alert('새 식재료가 등록되었습니다.');
            setView('LIST');
            setPage(0);
            await loadIngredients(0, debouncedSearchTerm);
        } catch (error) {
            console.error('Failed to create ingredient:', error);
            alert('등록에 실패했습니다.');
        }
    };

    const handleUpdate = async (updatedData: IngredientResponse) => {
        try {
            await updateIngredient(storePublicId, updatedData.ingredientPublicId, {
                name: updatedData.name,
                unit: updatedData.unit,
                lowStockThreshold: updatedData.lowStockThreshold,
                status: updatedData.status,
            });

            alert('정보가 수정되었습니다.');
            setView('LIST');
            setCurrentIngredient(null);
            await loadIngredients(page, debouncedSearchTerm);
        } catch (error) {
            console.error('Failed to update ingredient:', error);
            alert('수정에 실패했습니다.');
        }
    };

    const handleDelete = async (ingredientPublicId: string) => {
        if (!window.confirm('정말로 이 식재료를 삭제하시겠습니까?')) {
            return;
        }

        try {
            await deleteIngredient(storePublicId, ingredientPublicId);
            alert('삭제되었습니다.');

            const nextPage = ingredients.length === 1 && page > 0 ? page - 1 : page;

            setPage(nextPage);
            await loadIngredients(nextPage, debouncedSearchTerm);
        } catch (error) {
            console.error('Failed to delete ingredient:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const renderListView = () => (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6 pt-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-gray-900">재료 관리</h1>
                <p className="mt-3 text-sm text-gray-500">매장의 식재료 마스터 데이터를 관리하고 알림 임계치를 설정하세요.</p>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="relative w-full lg:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="식재료 명칭으로 검색..."
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-none bg-white text-gray-900 placeholder:text-gray-400 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setView('CREATE')}
                    className="w-full lg:w-auto bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 font-semibold shadow-sm"
                >
                    <Plus size={18} />
                    식재료 추가
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">식재료 목록</h2>
                        <p className="text-sm text-gray-500 mt-1">{pageLabel}</p>
                    </div>

                    <div className="text-sm text-gray-500">
                        페이지 {totalPages === 0 ? 0 : page + 1} / {totalPages}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    식재료명
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    단위
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    알림 임계치
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    상태
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                                    관리
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin text-black" size={24} />
                                            데이터를 불러오는 중입니다...
                                        </div>
                                    </td>
                                </tr>
                            ) : ingredients.length > 0 ? (
                                ingredients.map((item) => (
                                    <tr
                                        key={item.ingredientPublicId}
                                        className="hover:bg-gray-50 transition-colors group"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {UNIT_LABELS[item.unit]}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                            {item.lowStockThreshold?.toLocaleString() ?? '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setCurrentIngredient(item);
                                                        setView('EDIT');
                                                    }}
                                                    className="p-2 text-green-700 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-200 transition-all text-xs flex items-center gap-1"
                                                    title="수정"
                                                >
                                                    <Edit3 size={14} />
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.ingredientPublicId)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all text-xs flex items-center gap-1"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={14} />
                                                    삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500 font-bold">
                                        <div className="flex flex-col items-center gap-3">
                                            <AlertCircle size={40} className="text-gray-300" />
                                            데이터 검색 결과가 없습니다.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
                    <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                        disabled={page === 0 || isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                        이전
                    </button>

                    <div className="text-sm text-gray-500">
                        {totalPages === 0 ? 0 : page + 1} / {totalPages}
                    </div>

                    <button
                        onClick={() => setPage((prev) => (hasNext ? prev + 1 : prev))}
                        disabled={!hasNext || isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                        다음
                    </button>
                </div>
            </div>
        </div >
    );

    const renderFormView = (mode: 'CREATE' | 'EDIT') => {
        return (
            <FormViewInner
                mode={mode}
                currentIngredient={currentIngredient}
                setView={setView}
                handleUpdate={handleUpdate}
                handleCreate={handleCreate}
            />
        );
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            <main className="max-w-6xl mx-auto px-6">
                {view === 'LIST' && renderListView()}
                {view === 'CREATE' && renderFormView('CREATE')}
                {view === 'EDIT' && renderFormView('EDIT')}
            </main>

            <footer className="max-w-6xl mx-auto px-6 mt-20 text-center text-gray-400 text-xs">
                <p>© {new Date().getFullYear()} Inventory Master System</p>
            </footer>
        </div>
    );
}

interface FormViewInnerProps {
    mode: 'CREATE' | 'EDIT';
    currentIngredient: IngredientResponse | null;
    setView: (view: 'LIST' | 'CREATE' | 'EDIT') => void;
    handleUpdate: (data: IngredientResponse) => Promise<void>;
    handleCreate: (data: {
        name: string;
        unit: IngredientUnit;
        lowStockThreshold: number | null;
    }) => Promise<void>;
}

const FormViewInner: React.FC<FormViewInnerProps> = ({
    mode,
    currentIngredient,
    setView,
    handleUpdate,
    handleCreate,
}) => {
    const [form, setForm] = useState<Partial<IngredientResponse>>(
        mode === 'EDIT' && currentIngredient
            ? { ...currentIngredient }
            : {
                name: '',
                unit: 'EA' as IngredientUnit,
                lowStockThreshold: 0,
                status: 'ACTIVE' as IngredientStatus,
            }
    );

    useEffect(() => {
        if (mode === 'EDIT' && currentIngredient) {
            setForm({ ...currentIngredient });
        }
    }, [mode, currentIngredient]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.unit) {
            alert('식재료명과 단위는 필수입니다.');
            return;
        }

        if (mode === 'EDIT' && form.ingredientPublicId) {
            handleUpdate(form as IngredientResponse);
            return;
        }

        handleCreate({
            name: form.name,
            unit: form.unit as IngredientUnit,
            lowStockThreshold: form.lowStockThreshold ?? 0,
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        {mode === 'EDIT' ? '식재료 정보 수정' : '신규 식재료 등록'}
                    </h2>

                    <button
                        onClick={() => setView('LIST')}
                        className="text-gray-400 hover:text-gray-700 p-1 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            식재료 명칭 *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="예: 국산 대파 1단"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-none bg-white text-gray-900 placeholder:text-gray-400 transition-all"
                            value={form.name || ''}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                단위
                            </label>
                            <select
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-none appearance-none bg-white text-gray-900"
                                value={form.unit || 'EA'}
                                onChange={(e) =>
                                    setForm({ ...form, unit: e.target.value as IngredientUnit })
                                }
                            >
                                {INGREDIENT_UNITS.map((u) => (
                                    <option key={u} value={u}>
                                        {UNIT_LABELS[u]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                저재고 경고 기준
                            </label>
                            <input
                                type="number"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-none bg-white text-gray-900"
                                value={form.lowStockThreshold ?? 0}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        lowStockThreshold: Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                    </div>

                    {mode === 'EDIT' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                관리 상태
                            </label>
                            <div className="flex gap-3">
                                {INGREDIENT_STATUS.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() =>
                                            setForm({ ...form, status: s as IngredientStatus })
                                        }
                                        className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all ${form.status === s
                                            ? 'bg-black text-white border-black shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {s === 'ACTIVE' ? '활성 (ACTIVE)' : '비활성 (INACTIVE)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setView('LIST')}
                            className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
                        >
                            <X size={18} />
                            취소
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {mode === 'EDIT' ? '정보 업데이트' : '식재료 등록'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};