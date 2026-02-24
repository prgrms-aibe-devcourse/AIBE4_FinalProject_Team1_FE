import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Plus,
    Trash2,
    X,
    Printer,
    PackageSearch,
    PlusCircle,
    Edit,
    Edit3
} from 'lucide-react';
import {
    getIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    type IngredientResponse,
    type IngredientUnit,
    type IngredientStatus
} from '../../services/api/ingredient';

import { getStorePublicId } from '../../utils/store';

const INGREDIENT_UNITS: IngredientUnit[] = ["EA", "KG", "L"];
const INGREDIENT_STATUS: IngredientStatus[] = ["ACTIVE", "INACTIVE"];

const UNIT_LABELS: Record<IngredientUnit, string> = {
    EA: "개(EA)",
    KG: "kg",
    L: "L"
};

const StatusBadge = ({ status }: { status: IngredientStatus }) => {
    const styles = {
        ACTIVE: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        INACTIVE: "bg-slate-100 text-slate-500 border border-slate-200"
    };
    const labels = {
        ACTIVE: "활성",
        INACTIVE: "비활성"
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>;
};

export default function IngredientPage() {
    const storePublicId = getStorePublicId();

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
            const response = await getIngredients(storePublicId);
            setIngredients(response.data);
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
    const handleCreate = async (newData: { name: string; unit: IngredientUnit; lowStockThreshold: number }) => {
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

    const filteredIngredients = useMemo(() => {
        return ingredients.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [ingredients, searchTerm]);

    const ListView = () => (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
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
                                <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase text-right print:hidden">관리</th>
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
                                    <td className="px-6 py-4 text-right print:hidden">
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
                                        등록된 식재료가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const FormView = ({ mode }: { mode: 'CREATE' | 'EDIT' }) => {
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
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">단위 (Unit)</label>
                                <select
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none appearance-none bg-gray-50 focus:bg-white"
                                    value={form.unit}
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
                                    value={form.lowStockThreshold}
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

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="relative bg-gradient-to-br from-slate-800 to-slate-700 text-white py-12 px-6 mb-10 shadow-xl overflow-hidden">
                <div className="absolute right-[-5%] top-[-20%] w-[300px] h-[300px] bg-white opacity-5 rounded-full pointer-events-none" />

                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-white/20 px-3 py-1 rounded text-[10px] font-bold backdrop-blur-sm border border-white/10 uppercase">Catalog System</span>
                            <span className="text-white/60 text-xs">STORE ID: {storePublicId.substring(0, 8)}...</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">식재료 마스터 관리</h1>
                        <p className="text-white/70 mt-2 font-light">매장 운영에 필요한 원재료의 단위와 관리 기준을 설정합니다.</p>
                    </div>
                    <div className="flex gap-3 print:hidden">
                        <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-md transition flex items-center gap-2 border border-white/20 shadow-sm">
                            <Printer className="w-4 h-4" /> 리스트 PDF 출력
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6">
                {view === 'LIST' && <ListView />}
                {view === 'CREATE' && <FormView mode="CREATE" />}
                {view === 'EDIT' && <FormView mode="EDIT" />}
            </main>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto px-6 mt-20 text-center text-gray-400 text-xs print:hidden">
                <p>© {new Date().getFullYear()} Inventory Master System. Optimized for Spring Boot Backend Integration.</p>
            </footer>
        </div>
    );
}