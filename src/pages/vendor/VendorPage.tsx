import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Plus,
    Trash2,
    X,
    PackageSearch,
    PlusCircle,
    Edit3
} from 'lucide-react';
import {
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor
} from '@/api/vendor';
import type { VendorResponse, VendorStatus } from '@/types';
import { getStorePublicId } from '@/utils/store';

const StatusBadge = ({ status }: { status: VendorStatus }) => {
    const styles = {
        ACTIVE: "bg-amber-100 text-amber-700 border border-amber-200",
        INACTIVE: "bg-slate-100 text-slate-500 border border-slate-200"
    };
    const labels = {
        ACTIVE: "활성",
        INACTIVE: "비활성"
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

export default function VendorPage() {
    const storePublicId = getStorePublicId();

    // --- State ---
    const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
    const [vendors, setVendors] = useState<VendorResponse[]>([]);
    const [currentVendor, setCurrentVendor] = useState<VendorResponse | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // --- API 호출: 목록 로드 ---
    const loadVendors = async () => {
        setIsLoading(true);
        try {
            const response = await getVendors(storePublicId);
            setVendors(response.data);
        } catch (error) {
            console.error("Failed to load vendors:", error);
            alert("데이터를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadVendors();
    }, []);

    // --- Handlers ---
    const handleCreate = async (newData: {
        name: string;
        contactPerson?: string;
        phone?: string;
        email?: string;
        leadTimeDays?: number
    }) => {
        try {
            await createVendor(storePublicId, newData);
            alert("새 거래처가 등록되었습니다.");
            setView('LIST');
            loadVendors();
        } catch (error) {
            console.error("Failed to create vendor:", error);
            alert("등록에 실패했습니다.");
        }
    };

    const handleUpdate = async (updatedData: VendorResponse) => {
        try {
            await updateVendor(storePublicId, updatedData.vendorPublicId, {
                contactPerson: updatedData.contactPerson || undefined,
                phone: updatedData.phone || undefined,
                email: updatedData.email || undefined,
                leadTimeDays: updatedData.leadTimeDays || undefined
            });
            alert("정보가 수정되었습니다.");
            setView('LIST');
            setCurrentVendor(null);
            loadVendors();
        } catch (error) {
            console.error("Failed to update vendor:", error);
            alert("수정에 실패했습니다.");
        }
    };

    const handleDelete = async (vendorPublicId: string) => {
        if (!window.confirm("정말로 이 거래처를 비활성화하시겠습니까?")) return;
        try {
            await deleteVendor(storePublicId, vendorPublicId);
            alert("거래처가 비활성화되었습니다.");
            loadVendors();
        } catch (error) {
            console.error("Failed to delete vendor:", error);
            alert("비활성화에 실패했습니다.");
        }
    };

    const filteredVendors = useMemo(() => {
        return vendors.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [vendors, searchTerm]);

    const ListView = () => (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="거래처명으로 검색..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setView('CREATE')}
                        className="flex-1 md:flex-none bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2 shadow-md"
                    >
                        <Plus className="w-4 h-4" /> 거래처 추가
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">거래처명</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">담당자</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">연락처</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">이메일</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">리드타임</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase">상태</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase text-right print:hidden">관리</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                                    데이터 로딩 중...
                                </td>
                            </tr>
                        ) : filteredVendors.length > 0 ? (
                            filteredVendors.map((item) => (
                                <tr key={item.vendorPublicId} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{item.contactPerson || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{item.phone || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{item.email || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                        {item.leadTimeDays ? `${item.leadTimeDays}일` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right print:hidden">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setCurrentVendor(item);
                                                    setView('EDIT');
                                                }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md border border-transparent hover:border-blue-100 transition-all font-bold text-xs flex items-center gap-1"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" /> 수정
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.vendorPublicId)}
                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md border border-transparent hover:border-rose-100 transition-all font-bold text-xs flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> 삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                                    <PackageSearch className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    등록된 거래처가 없습니다.
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
        const [form, setForm] = useState<Partial<VendorResponse>>(
            mode === 'EDIT' && currentVendor
                ? { ...currentVendor }
                : {
                    name: '',
                    contactPerson: '',
                    phone: '',
                    email: '',
                    leadTimeDays: 1,
                    status: 'ACTIVE' as VendorStatus
                }
        );

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (mode === 'EDIT' && form.vendorPublicId) {
                handleUpdate(form as VendorResponse);
            } else {
                handleCreate({
                    name: form.name!,
                    contactPerson: form.contactPerson || undefined,
                    phone: form.phone || undefined,
                    email: form.email || undefined,
                    leadTimeDays: form.leadTimeDays || undefined
                });
            }
        };

        return (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {mode === 'EDIT' ? (
                                <Edit3 className="text-amber-600" />
                            ) : (
                                <PlusCircle className="text-amber-600" />
                            )}
                            {mode === 'EDIT' ? '거래처 정보 수정' : '신규 거래처 등록'}
                        </h2>
                        <button
                            onClick={() => setView('LIST')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                거래처명 *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="예: 신선마트"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 focus:bg-white transition-all"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                disabled={mode === 'EDIT'}
                            />
                            {mode === 'EDIT' && (
                                <p className="text-xs text-gray-500 mt-1">
                                    거래처명은 수정할 수 없습니다.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    담당자명
                                </label>
                                <input
                                    type="text"
                                    placeholder="예: 김철수"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 focus:bg-white"
                                    value={form.contactPerson || ''}
                                    onChange={(e) =>
                                        setForm({ ...form, contactPerson: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    연락처
                                </label>
                                <input
                                    type="tel"
                                    placeholder="예: 010-1234-5678"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 focus:bg-white"
                                    value={form.phone || ''}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    이메일
                                </label>
                                <input
                                    type="email"
                                    placeholder="예: vendor@example.com"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 focus:bg-white"
                                    value={form.email || ''}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    리드타임 (일)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    placeholder="1"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 focus:bg-white"
                                    value={form.leadTimeDays || ''}
                                    onChange={(e) =>
                                        setForm({ ...form, leadTimeDays: Number(e.target.value) })
                                    }
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    발주부터 입고까지 소요 일수
                                </p>
                            </div>
                        </div>

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
                                className="flex-1 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shadow-lg transition active:scale-[0.98]"
                            >
                                {mode === 'EDIT' ? '정보 업데이트' : '거래처 등록'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* 페이지 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">거래처 관리</h1>
                        <p className="text-sm text-slate-600 mt-1">
                            발주를 위한 거래처 정보를 관리합니다.
                        </p>
                    </div>
                </div>

                {/* 뷰 전환 */}
                {view === 'LIST' && <ListView />}
                {view === 'CREATE' && <FormView mode="CREATE" />}
                {view === 'EDIT' && <FormView mode="EDIT" />}
            </div>
        </div>
    );
}
