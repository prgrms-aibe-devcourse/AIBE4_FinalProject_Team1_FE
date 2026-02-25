import { useState, useEffect } from 'react';
import { LayoutGrid, Map, Printer, Settings2, Trash2, Edit3, X, Settings, Plus, Utensils, Loader2 } from 'lucide-react';
import {
    getTables,
    createTable,
    updateTable as apiUpdateTable,
    deleteTable as apiDeleteTable,
    type DiningTableResponse
} from '@/api';
import { requireStorePublicId } from '@/utils/store';

const DiningTablePage = () => {
    const storePublicId = requireStorePublicId();

    // 상태 관리
    const [tables, setTables] = useState<DiningTableResponse[]>([]);
    const [newTableCode, setNewTableCode] = useState('');
    const [editingTable, setEditingTable] = useState<DiningTableResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 데이터 로드
    const fetchTables = async () => {
        setIsLoading(true);
        try {
            const data = await getTables(storePublicId);
            setTables(data);
        } catch (error) {
            console.error("Failed to fetch tables", error);
            alert("테이블 목록을 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    // CRUD 로직
    const addTable = async () => {
        if (!newTableCode.trim()) return;
        if (tables.some(t => t.tableCode === newTableCode.trim())) {
            alert("이미 존재하는 테이블 이름입니다.");
            return;
        }

        try {
            await createTable(storePublicId, {
                tableCode: newTableCode.trim(),
                capacity: 4, // 기본값
                status: 'ACTIVE'
            });
            setNewTableCode('');
            fetchTables();
        } catch (error) {
            console.error("Failed to add table", error);
            alert("테이블 추가에 실패했습니다.");
        }
    };

    const deleteTable = async (id: string) => {
        if (window.confirm("정말로 이 테이블을 삭제하시겠습니까?")) {
            try {
                await apiDeleteTable(storePublicId, id);
                fetchTables();
            } catch (error) {
                console.error("Failed to delete table", error);
                alert("테이블 삭제에 실패했습니다.");
            }
        }
    };

    const handleUpdateTable = async () => {
        if (!editingTable || !editingTable.tableCode.trim()) return;
        try {
            await apiUpdateTable(storePublicId, editingTable.tablePublicId, {
                tableCode: editingTable.tableCode.trim(),
                capacity: editingTable.capacity,
                status: editingTable.status
            });
            setEditingTable(null);
            fetchTables();
        } catch (error) {
            console.error("Failed to update table", error);
            alert("테이블 수정에 실패했습니다.");
        }
    };

    const toggleStatus = async (table: DiningTableResponse) => {
        const newStatus = table.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await apiUpdateTable(storePublicId, table.tablePublicId, {
                status: newStatus
            });
            fetchTables();
        } catch (error) {
            console.error("Failed to toggle status", error);
            alert("상태 변경에 실패했습니다.");
        }
    };

    const getStatusColor = (status: string) => {
        return status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

            {/* 상단 배너 (Header) */}
            <header className="bg-slate-900 shadow-xl no-print">
                <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-500/30 rotate-3">
                            <LayoutGrid size={32} className="text-white" />
                        </div>
                        <div className="text-white">
                            <h1 className="text-3xl font-black tracking-tighter uppercase">테이블 관리</h1>
                            <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-[0.2em] opacity-80">Floor Management System</p>
                        </div>
                    </div>

                    {/* 테이블 빠른 추가 */}
                    <div className="bg-white/10 backdrop-blur-xl p-2 rounded-2xl flex items-center gap-2 border border-white/10 w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="새 테이블 이름 입력..."
                            value={newTableCode}
                            onChange={(e) => setNewTableCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTable()}
                            className="bg-transparent text-white placeholder:text-slate-500 px-4 py-2 w-full focus:outline-none font-bold"
                        />
                        <button
                            onClick={addTable}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={18} /> 추가
                        </button>
                    </div>
                </div>
            </header>

            {/* 메인 콘텐츠 영역 */}
            <main className="max-w-6xl w-full mx-auto px-6 py-12 space-y-16">

                {/* 플로어 배치도 섹션 */}
                <section>
                    <div className="flex justify-between items-end mb-10">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <Map size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">실시간 배치도</h2>
                                <p className="text-slate-500 text-sm mt-1">테이블을 클릭하여 ACTIVE / INACTIVE 상태를 즉시 전환합니다.</p>
                            </div>
                        </div>
                        <div className="hidden sm:flex gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest no-print">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Active</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-400"></span> Inactive</div>
                        </div>
                    </div>

                    {tables.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-24 text-center">
                            <Utensils size={48} className="text-slate-200 mx-auto mb-6" />
                            <p className="text-slate-400 font-bold text-lg">아직 등록된 테이블이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {tables.map(table => (
                                <div
                                    key={table.tablePublicId}
                                    onClick={() => toggleStatus(table)}
                                    className={`group relative aspect-square rounded-[2rem] border-2 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-2 ${table.status === 'ACTIVE'
                                        ? 'bg-white border-indigo-50 hover:border-indigo-400'
                                        : 'bg-slate-100 border-slate-200 grayscale opacity-60'
                                        }`}
                                >
                                    <div className={`absolute top-5 right-5 w-3.5 h-3.5 rounded-full ${getStatusColor(table.status)} shadow-lg ring-4 ring-white`}></div>

                                    <span className="text-4xl font-black text-slate-800 mb-1">{table.tableCode}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${table.status === 'ACTIVE' ? 'text-indigo-600' : 'text-slate-500'}`}>
                                        {table.status}
                                    </span>

                                    {/* 호버 액션 버튼 */}
                                    <div className="absolute inset-0 bg-slate-900/10 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity no-print pointer-events-none flex items-end justify-center p-4">
                                        <div className="flex gap-2 pointer-events-auto">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingTable(table); }} className="p-2.5 bg-white text-slate-800 rounded-xl hover:bg-slate-900 hover:text-white transition shadow-xl">
                                                <Settings2 size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteTable(table.tablePublicId); }} className="p-2.5 bg-white text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition shadow-xl">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 상세 리스트 섹션 */}
                <section>
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">상세 리스트</h3>
                                    <p className="text-xs text-slate-400 mt-0.5 font-bold uppercase tracking-widest">Total Count: {tables.length}</p>
                                </div>
                            </div>
                            <button onClick={() => window.print()} className="no-print p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                <Printer size={20} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                                    <tr>
                                        <th className="px-10 py-5">테이블 명칭</th>
                                        <th className="px-10 py-5 text-center">상태</th>
                                        <th className="px-10 py-5">비고</th>
                                        <th className="px-10 py-5 text-right no-print">액션</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tables.map(t => (
                                        <tr key={t.tablePublicId} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-10 py-6">
                                                <span className="text-2xl font-black text-slate-700 tracking-tighter">{t.tableCode}</span>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest ${t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(t.status)}`}></span>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className="text-slate-400 font-medium text-sm">
                                                    {t.status === 'ACTIVE' ? '이용 가능' : '시설 점검 / 이용 불가'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-right no-print">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingTable(t)} className="p-2 text-slate-300 hover:text-indigo-600 transition">
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button onClick={() => deleteTable(t.tablePublicId)} className="p-2 text-slate-300 hover:text-rose-600 transition">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {tables.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-bold uppercase tracking-widest">No Data Available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>

            {/* 수정 모달 (Edit Modal) */}
            {editingTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6 no-print">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-slate-900 p-10 text-white relative">
                            <h3 className="text-3xl font-black flex items-center gap-4">
                                <Settings className="text-indigo-400" />
                                테이블 수정
                            </h3>
                            <p className="text-slate-500 text-xs mt-2 uppercase font-black tracking-[0.2em]">Table Property Configuration</p>
                            <button
                                onClick={() => setEditingTable(null)}
                                className="absolute top-8 right-8 text-slate-500 hover:text-white transition"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">테이블 명칭</label>
                                <input
                                    type="text"
                                    value={editingTable.tableCode}
                                    onChange={(e) => setEditingTable({ ...editingTable, tableCode: e.target.value })}
                                    className="w-full border-2 border-slate-100 rounded-2xl px-6 py-4 focus:border-indigo-500 focus:outline-none font-black text-2xl text-slate-700 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">운영 상태 설정</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {(['ACTIVE', 'INACTIVE'] as const).map(st => (
                                        <button
                                            key={st}
                                            onClick={() => setEditingTable({ ...editingTable, status: st })}
                                            className={`px-6 py-5 rounded-2xl text-xs font-black transition-all border-2 ${editingTable.status === st
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {st === 'ACTIVE' ? '활성화 (ACTIVE)' : '비활성 (INACTIVE)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleUpdateTable}
                                    className="w-full px-8 py-5 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                                >
                                    변경사항 저장하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <footer className="py-12 text-center no-print">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em]">Dining Administration Dashboard</p>
            </footer>
        </div>
    );
};

export default DiningTablePage;
