import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Save,
    Info,
    DollarSign,
    Layers,
    ArrowLeft,
    Loader2,
    AlertCircle,
} from 'lucide-react';

import {
    getMenus,
    createMenu,
    updateMenu,
    deleteMenu,
    type MenuResponse,
    type MenuStatus,
} from '@/api';

import { getIngredients, type IngredientResponse } from '@/api';
import { requireStorePublicId } from '@/utils/store.ts';

/**
 * 폼에서 사용하는 레시피 Row
 * - ingredientPublicId / qty / unit 이 "저장 스키마"
 * - name 은 화면 표시 편의(선택)
 */
interface MenuFormRecipeRow {
    ingredientPublicId: string;
    name: string;
    qty: string | number;
    unit: string;
}

interface MenuFormData {
    name: string;
    basePrice: string | number;
    status: MenuStatus;
    ingredients: MenuFormRecipeRow[];
}

const MenuPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
    const storePublicId = requireStorePublicId();

    const [menus, setMenus] = useState<MenuResponse[]>([]);
    const [availableIngredients, setAvailableIngredients] = useState<IngredientResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentMenu, setCurrentMenu] = useState<MenuResponse | null>(null);

    const [formData, setFormData] = useState<MenuFormData>({
        name: '',
        basePrice: '',
        status: 'ACTIVE',
        ingredients: [],
    });

    // --- API 호출 ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [menuData, ingredientData] = await Promise.all([
                getMenus(storePublicId),
                getIngredients(storePublicId),
            ]);
            setMenus(menuData);
            setAvailableIngredients(ingredientData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            alert('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMenus = async () => {
        try {
            const data = await getMenus(storePublicId);
            setMenus(data);
        } catch (error) {
            console.error('Failed to fetch menus:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 검색 필터링
    const filteredMenus = useMemo(() => {
        return menus.filter((m: MenuResponse) =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [menus, searchTerm]);

    // 메뉴 생성/수정 폼 초기화
    const openForm = (menu: MenuResponse | null = null) => {
        if (menu) {
            setCurrentMenu(menu);

            // menu.ingredientsJson 의 shape가 지금부터는
            // [{ ingredientPublicId, qty, unit, name? }] 를 기대
            const ingredients: MenuFormRecipeRow[] = Array.isArray(menu.ingredientsJson)
                ? (menu.ingredientsJson as any[]).map((r) => ({
                    ingredientPublicId: r.ingredientPublicId ?? '',
                    name: r.name ?? '',
                    qty: r.qty ?? '',
                    unit: r.unit ?? 'EA',
                }))
                : [];

            setFormData({
                name: menu.name,
                basePrice: menu.basePrice,
                status: menu.status,
                ingredients,
            });
            setViewMode('EDIT');
        } else {
            setCurrentMenu(null);
            setFormData({
                name: '',
                basePrice: '',
                status: 'ACTIVE',
                ingredients: [{ ingredientPublicId: '', name: '', qty: '', unit: 'EA' }],
            });
            setViewMode('CREATE');
        }
    };

    // 식재료 행 추가
    const addIngredientRow = () => {
        setFormData((prev) => ({
            ...prev,
            ingredients: [
                ...prev.ingredients,
                { ingredientPublicId: '', name: '', qty: '', unit: 'EA' },
            ],
        }));
    };

    // 식재료 행 삭제
    const removeIngredientRow = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index),
        }));
    };

    // 식재료 선택 핸들러: ingredientPublicId 기준
    const handleSelectIngredient = (index: number, ingredientPublicId: string) => {
        const target = availableIngredients.find(
            (ing) => ing.ingredientPublicId === ingredientPublicId
        );

        setFormData((prev) => ({
            ...prev,
            ingredients: prev.ingredients.map((row, i) => {
                if (i !== index) return row;
                return {
                    ...row,
                    ingredientPublicId,
                    name: target?.name ?? '',
                    unit: target?.unit ?? 'EA',
                };
            }),
        }));
    };

    // 식재료 수량 변경
    const handleIngredientQtyChange = (index: number, value: string) => {
        setFormData((prev) => ({
            ...prev,
            ingredients: prev.ingredients.map((row, i) =>
                i === index ? { ...row, qty: value } : row
            ),
        }));
    };

    // 저장
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const ingredientsJson = formData.ingredients
            .filter((r) => r.ingredientPublicId && String(r.qty).trim() !== '')
            .map((r) => ({
                ingredientPublicId: r.ingredientPublicId,
                qty: r.qty,
                unit: r.unit,
                name: r.name,
            }));

        const payloadCreate = {
            name: formData.name,
            basePrice: Number(formData.basePrice),
            ingredientsJson,
        };

        const payloadUpdate = {
            name: formData.name,
            basePrice: Number(formData.basePrice),
            status: formData.status,
            ingredientsJson,
        };

        try {
            if (viewMode === 'CREATE') {
                await createMenu(storePublicId, payloadCreate as any);
                alert('새 메뉴가 등록되었습니다.');
            } else if (currentMenu) {
                await updateMenu(storePublicId, currentMenu.menuPublicId, payloadUpdate as any);
                alert('메뉴 정보가 수정되었습니다.');
            }
            setViewMode('LIST');
            fetchMenus();
        } catch (error) {
            console.error('Failed to save menu:', error);
            alert('메뉴 저장 중 오류가 발생했습니다.');
        }
    };

    // 메뉴 삭제
    const handleDelete = async (publicId: string) => {
        if (window.confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
            try {
                await deleteMenu(storePublicId, publicId);
                alert('메뉴가 삭제되었습니다.');
                fetchMenus();
            } catch (error) {
                console.error('Failed to delete menu:', error);
                alert('메뉴 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    // 상태 배지
    const StatusBadge = ({ status }: { status: MenuStatus }) => {
        const styles: Record<MenuStatus, string> = {
            ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            INACTIVE: 'bg-amber-100 text-amber-700 border-amber-200',
            DELETED: 'bg-red-100 text-red-700 border-red-200',
        };
        return (
            <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${styles[status]}`}
            >
                {status === 'ACTIVE' ? '판매 중' : '판매 중지'}
            </span>
        );
    };

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
            <nav className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-100 p-2 rounded-xl text-slate-400">
                            <Layers size={18} />
                        </div>
                        <span className="font-bold text-slate-500 text-sm">Inventory Menu Catalog</span>
                    </div>
                    <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        Store Public ID:{' '}
                        <span className="text-slate-900 font-mono ml-1 uppercase">
                            {storePublicId.substring(0, 8)}
                        </span>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-8">
                {viewMode === 'LIST' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900">메뉴 관리</h1>
                                <p className="text-slate-500 mt-1 font-medium italic">
                                    매장 메뉴를 등록하고 구성 식재료 레시피를 관리합니다.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        size={18}
                                    />
                                    <input
                                        type="text"
                                        placeholder="메뉴명 검색..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-64 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => openForm()}
                                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200"
                                >
                                    <Plus size={20} strokeWidth={3} />
                                    신규 메뉴 추가
                                </button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                                <p className="text-slate-400 font-bold">메뉴 정보를 불러오는 중입니다...</p>
                            </div>
                        ) : filteredMenus.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredMenus.map((menu) => (
                                    <div
                                        key={menu.menuPublicId}
                                        className="bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-2xl hover:shadow-slate-200 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4">
                                            <button
                                                onClick={() => handleDelete(menu.menuPublicId)}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="flex flex-col h-full">
                                            <div className="mb-4">
                                                <StatusBadge status={menu.status} />
                                                <h3 className="text-xl font-black text-slate-800 mt-2 tracking-tight group-hover:text-emerald-600 transition-colors">
                                                    {menu.name}
                                                </h3>
                                                <p className="text-emerald-600 font-black text-lg mt-1">
                                                    ₩ {menu.basePrice?.toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex-1 bg-slate-50 rounded-2xl p-4 mb-6">
                                                <div className="flex items-center gap-2 mb-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                    <Layers size={12} />
                                                    구성 식재료 ({(menu.ingredientsJson as any[])?.length || 0})
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(menu.ingredientsJson as any[])?.slice(0, 3).map((ing: any, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            className="bg-white px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 border border-slate-100 flex items-center gap-1"
                                                        >
                                                            {ing.name ?? '재료'}{' '}
                                                            <span className="text-[9px] text-slate-300">{ing.unit ?? ''}</span>
                                                        </span>
                                                    ))}
                                                    {((menu.ingredientsJson as any[])?.length || 0) > 3 && (
                                                        <span className="text-[11px] font-bold text-slate-300 ml-1">
                                                            +{(menu.ingredientsJson as any[]).length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => openForm(menu)}
                                                className="w-full py-3 bg-slate-50 rounded-xl text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all"
                                            >
                                                <Edit3 size={16} />
                                                상세 정보 수정
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-20 text-center">
                                <Layers className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold">등록된 메뉴가 없습니다.</p>
                                <button onClick={() => openForm()} className="mt-4 text-emerald-600 font-black hover:underline">
                                    첫 번째 메뉴를 등록해보세요
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-right-8 duration-500 max-w-4xl mx-auto">
                        <header className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setViewMode('LIST')}
                                    className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-sm"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h1 className="text-2xl font-black tracking-tight">
                                    {viewMode === 'CREATE' ? '신규 메뉴 등록' : '메뉴 정보 수정'}
                                </h1>
                            </div>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl shadow-slate-100">
                                <h2 className="text-lg font-black mb-8 flex items-center gap-2">
                                    <Info size={20} className="text-emerald-500" />
                                    기본 설정
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            메뉴 이름
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 font-bold text-slate-800 outline-none transition-all"
                                            placeholder="예: 시그니처 크림 라떼"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            기본 가격 (₩)
                                        </label>
                                        <div className="relative">
                                            <input
                                                required
                                                type="number"
                                                value={formData.basePrice}
                                                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 pl-10 font-bold text-slate-800 outline-none transition-all"
                                                placeholder="0"
                                            />
                                            <DollarSign
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                                                size={18}
                                            />
                                        </div>
                                    </div>

                                    {/* 상태 버튼: 백엔드가 CREATE에서 status를 안 받으면 UI만 유지되고 저장에는 영향 없음 */}
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            판매 상태
                                        </label>
                                        <div className="flex gap-4">
                                            {(['ACTIVE', 'INACTIVE'] as MenuStatus[]).map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status: s })}
                                                    className={`flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all ${formData.status === s
                                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-50'
                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                        }`}
                                                >
                                                    {s === 'ACTIVE' ? '현재 판매 중' : '판매 일시 중지'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 레시피 */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl shadow-slate-100">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-lg font-black flex items-center gap-2">
                                        <Layers size={20} className="text-emerald-500" />
                                        식재료 레시피 구성
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={addIngredientRow}
                                        className="text-xs font-black text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl transition"
                                    >
                                        + 식재료 추가
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.ingredients.map((ing, index) => (
                                        <div key={index} className="flex gap-3 animate-in fade-in zoom-in duration-300">
                                            <div className="flex-[2.5] relative">
                                                <select
                                                    required
                                                    value={ing.ingredientPublicId}
                                                    onChange={(e) => handleSelectIngredient(index, e.target.value)}
                                                    className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold focus:bg-white border border-transparent focus:border-slate-200 outline-none transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="" disabled>
                                                        식재료 선택
                                                    </option>
                                                    {availableIngredients.map((available) => (
                                                        <option key={available.ingredientPublicId} value={available.ingredientPublicId}>
                                                            {available.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                                    <Search size={14} />
                                                </div>
                                            </div>

                                            <input
                                                required
                                                type="number"
                                                step="0.001"
                                                placeholder="수량"
                                                value={ing.qty}
                                                onChange={(e) => handleIngredientQtyChange(index, e.target.value)}
                                                className="flex-1 bg-slate-50 rounded-xl p-3 text-sm font-bold focus:bg-white border border-transparent focus:border-slate-200 outline-none transition-all text-center"
                                            />

                                            <div className="flex-1 bg-slate-100 rounded-xl p-3 text-xs font-black text-slate-400 flex items-center justify-center border border-transparent">
                                                {ing.unit || '단위'}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeIngredientRow(index)}
                                                className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    {formData.ingredients.length === 0 && (
                                        <div className="text-center py-10 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-slate-400 text-sm font-bold">
                                            추가된 식재료 레시피가 없습니다.
                                        </div>
                                    )}
                                </div>

                                <p className="mt-4 text-[10px] text-slate-400 flex items-center gap-1">
                                    <AlertCircle size={10} />
                                    식재료는 '식재료 관리' 탭에 등록된 항목만 선택할 수 있습니다.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('LIST')}
                                    className="flex-1 py-5 bg-white border-2 border-slate-100 rounded-[2rem] font-black text-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    취소하기
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={20} />
                                    {viewMode === 'CREATE' ? '새로운 메뉴 등록 완료' : '메뉴 정보 수정 완료'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MenuPage;