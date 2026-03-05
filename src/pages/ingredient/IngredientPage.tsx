import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Plus,
    Trash2,
    X,
    PackageSearch,
    PlusCircle,
    Edit,
    Edit3,
    Leaf
} from 'lucide-react';
import {
    getIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient
} from '@/api/ingredient';
import type {
    IngredientResponse,
    IngredientUnit,
    IngredientStatus
} from '@/types';
import { requireStorePublicId } from '@/utils/store';

const INGREDIENT_UNITS: IngredientUnit[] = ["EA", "G", "ML"];
const INGREDIENT_STATUS: IngredientStatus[] = ["ACTIVE", "INACTIVE"];

const UNIT_LABELS: Record<IngredientUnit, string> = {
    EA: "개(EA)",
    G: "g",
    ML: "ml"
};

const StatusBadge = ({ status }: { status: IngredientStatus }) => {
    const styles: Record<IngredientStatus, string> = {
        ACTIVE: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        INACTIVE: "bg-slate-100 text-slate-500 border border-slate-200"
    };
    const labels: Record<IngredientStatus, string> = {
        ACTIVE: "활성",
        INACTIVE: "비활성"
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>;
};

export default function IngredientPage() {
    const storePublicId = requireStorePublicId();

    // --- State ---
    const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
    const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
    const [currentIngredient, setCurrentIngredient] = useState<IngredientResponse | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // --- API 호출: 목록 로드 ---
    const loadIngredients = async () => {
        setIsLoading(true);
        try {
            const data = await getIngredients(storePublicId);
            setIngredients(data);
        } catch (error) {
            console.error("Failed to load ingredients:", error);
            alert("데이터를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadIngredients();
    }, []);

    // --- Handlers ---
    const handleCreate = async (newData: { name: string; unit: IngredientUnit; lowStockThreshold: number | null }) => {
        try {
            await createIngredient(storePublicId, newData);
            alert("새 식재료가 등록되었습니다.");
            setView('LIST');
            loadIngredients();
        } catch (error) {
            console.error("Failed to create ingredient:", error);
            alert("등록에 실패했습니다.");
        }
    };

    const handleUpdate = async (updatedData: IngredientResponse) => {
        try {
            await updateIngredient(storePublicId, updatedData.ingredientPublicId, {
                name: updatedData.name,
                unit: updatedData.unit,
                lowStockThreshold: updatedData.lowStockThreshold,
                status: updatedData.status
            });
            alert("정보가 수정되었습니다.");
            setView('LIST');
            setCurrentIngredient(null);
            loadIngredients();
        } catch (error) {
            console.error("Failed to update ingredient:", error);
            alert("수정에 실패했습니다.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("정말로 이 식재료를 삭제하시겠습니까?")) return;
        try {
            await deleteIngredient(storePublicId, id);
            alert("삭제되었습니다.");
            loadIngredients();
        } catch (error) {
            console.error("Failed to delete ingredient:", error);
            alert("삭제에 실패했습니다.");
        }
    };

    // --- 검색 필터링 로직 개선 ---
    const filteredIngredients = useMemo(() => {
        const target = searchTerm.trim().toLowerCase();
        if (!target) return ingredients;

        return ingredients.filter(item =>
            item.name.toLowerCase().includes(target)
        );
    }, [ingredients, searchTerm]);

    const renderListView = () => (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="식재료 명칭으로 검색..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none bg-white transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setView('CREATE')}
                        className="flex-1 md:flex-none bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-md"
                    >
                        <Plus className="w-4 h-4" /> 식재료 추가
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">식재료명</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">단위</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">알림 임계치</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">상태</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">데이터 로딩 중...</td>
                                </tr>
                            ) : filteredIngredients.length > 0 ? filteredIngredients.map((item) => (
                                <tr key={item.ingredientPublicId} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{UNIT_LABELS[item.unit]}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{item.lowStockThreshold?.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setCurrentIngredient(item); setView('EDIT'); }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md border border-transparent hover:border-blue-100 transition-all font-bold text-xs flex items-center gap-1"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" /> 수정
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.ingredientPublicId)}
                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md border border-transparent hover:border-rose-100 transition-all font-bold text-xs flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> 삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                                        <PackageSearch className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        검색 결과가 없거나 등록된 식재료가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
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
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white border-b border-gray-100 shadow-sm py-8 px-6 mb-10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                            <Leaf className="text-white w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-100">Inventory Management</span>
                                <span className="text-slate-300 text-[10px] font-mono">ID: {storePublicId.substring(0, 8)}</span>
                            </div>
                            <p className="text-slate-400 text-xs mt-1 font-medium">실시간 식재료 재고 및 마스터 데이터 관리</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6">
                {view === 'LIST' && renderListView()}
                {view === 'CREATE' && renderFormView('CREATE')}
                {view === 'EDIT' && renderFormView('EDIT')}
            </main>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto px-6 mt-20 text-center text-gray-400 text-xs">
                <p>© {new Date().getFullYear()} Inventory Master System. Optimized for Spring Boot Backend Integration.</p>
            </footer>
        </div>
    );
}

// FormView의 상태 관리를 위해 별도 컴포넌트로 분리 (Remounting 방지)
interface FormViewInnerProps {
    mode: 'CREATE' | 'EDIT';
    currentIngredient: IngredientResponse | null;
    setView: (view: 'LIST' | 'CREATE' | 'EDIT') => void;
    handleUpdate: (data: IngredientResponse) => Promise<void>;
    handleCreate: (data: { name: string; unit: IngredientUnit; lowStockThreshold: number | null }) => Promise<void>;
}

const FormViewInner: React.FC<FormViewInnerProps> = ({ mode, currentIngredient, setView, handleUpdate, handleCreate }) => {
    const [form, setForm] = useState<Partial<IngredientResponse>>(
        mode === 'EDIT' && currentIngredient ? { ...currentIngredient } : {
            name: '',
            unit: 'EA' as IngredientUnit,
            lowStockThreshold: 0,
            status: 'ACTIVE' as IngredientStatus
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'EDIT' && form.ingredientPublicId) {
            handleUpdate(form as IngredientResponse);
        } else {
            handleCreate(form as { name: string; unit: IngredientUnit; lowStockThreshold: number });
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {mode === 'EDIT' ? <Edit className="text-slate-900" /> : <PlusCircle className="text-slate-900" />}
                        {mode === 'EDIT' ? '식재료 정보 수정' : '신규 식재료 등록'}
                    </h2>
                    <button onClick={() => setView('LIST')} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">식재료 명칭 *</label>
                        <input
                            type="text"
                            required
                            placeholder="예: 국산 대파 1단"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none bg-gray-50 focus:bg-white transition-all"
                            value={form.name || ''}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">단위 (Unit)</label>
                            <select
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none appearance-none bg-gray-50 focus:bg-white"
                                value={form.unit || 'EA'}
                                onChange={(e) => setForm({ ...form, unit: e.target.value as IngredientUnit })}
                            >
                                {INGREDIENT_UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">저재고 경고 기준</label>
                            <input
                                type="number"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none bg-gray-50 focus:bg-white"
                                value={form.lowStockThreshold || 0}
                                onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    {mode === 'EDIT' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">관리 상태</label>
                            <div className="flex gap-3">
                                {INGREDIENT_STATUS.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setForm({ ...form, status: s as IngredientStatus })}
                                        className={`flex-1 py-3 text-sm font-bold rounded-lg border transition-all ${form.status === s ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
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
                            className="flex-1 py-3 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-lg transition active:scale-[0.98]"
                        >
                            {mode === 'EDIT' ? '정보 업데이트' : '식재료 등록'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};