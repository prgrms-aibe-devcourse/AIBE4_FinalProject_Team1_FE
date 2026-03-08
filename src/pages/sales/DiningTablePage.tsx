import { useState, useEffect, useMemo } from 'react';
import {
    Map, Printer, Settings2, Trash2, Edit3, X,
    Plus, Loader2, QrCode, CheckCircle2, AlertCircle, RefreshCcw,
    CheckSquare, Square, Calendar
} from 'lucide-react';
import {
    getTables,
    createTable,
    updateTable as apiUpdateTable,
    deleteTable as apiDeleteTable,
    getTableQrs,
    issueTableQrs,
    apiClient
} from '@/api';
import type {
    DiningTableResponse,
    TableQrResponse
} from '@/types';
import { requireStorePublicId } from '@/utils/store';

interface TableWithQr extends DiningTableResponse {
    qrInfo?: TableQrResponse;
}

/**
 * [MAIN COMPONENT]
 */
const DiningTablePage = () => {
    const storePublicId = requireStorePublicId();

    const [tables, setTables] = useState<DiningTableResponse[]>([]);
    const [qrList, setQrList] = useState<TableQrResponse[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [newTableCode, setNewTableCode] = useState('');
    const [editingTable, setEditingTable] = useState<DiningTableResponse | null>(null);
    const [viewingQr, setViewingQr] = useState<TableWithQr | null>(null);
    const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null); // QR 이미지 블롭 URL
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isQrLoading, setIsQrLoading] = useState(false); // QR 이미지 로딩 상태

    const combinedData = useMemo(() => {
        return tables.map(table => ({
            ...table,
            qrInfo: qrList.find(qr => qr.tablePublicId === table.tablePublicId)
        })) as TableWithQr[];
    }, [tables, qrList]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tableData, qrData] = await Promise.all([
                getTables(storePublicId),
                getTableQrs(storePublicId)
            ]);
            setTables(tableData || []);
            setQrList(qrData || []);
        } catch (error) {
            console.error("데이터 로드 실패", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleIssueQrs = async (ids: string[]) => {
        if (ids.length === 0) return;

        const alreadyIssuedCount = ids.filter(id => qrList.some(q => q.tablePublicId === id)).length;
        if (alreadyIssuedCount > 0) {
            if (!window.confirm(`${alreadyIssuedCount}개의 테이블에는 이미 QR이 발급되어 있습니다.\n재발급 시 기존 QR은 사용할 수 없게 됩니다. 계속하시겠습니까?`)) {
                return;
            }
        }

        setIsActionLoading(true);
        try {
            await issueTableQrs(storePublicId, ids);
            await fetchData();
            setSelectedIds([]);
        } catch (error) {
            console.error("QR 발급 실패", error);
            alert("QR 발급 실패");
        } finally {
            setIsActionLoading(false);
        }
    };

    // QR 이미지를 블롭으로 가져오기 (인증 헤더 포함)
    useEffect(() => {
        let currentBlobUrl: string | null = null;

        if (viewingQr?.qrInfo?.qrImageUrl) {
            const loadQrImage = async () => {
                setIsQrLoading(true);
                try {
                    const response = await apiClient.get(viewingQr.qrInfo!.qrImageUrl, {
                        responseType: 'blob'
                    });
                    currentBlobUrl = URL.createObjectURL(response.data);
                    setQrBlobUrl(currentBlobUrl);
                } catch (error) {
                    console.error("QR 이미지 로드 실패", error);
                    // 직접 URL 사용 시도 (fallback)
                    setQrBlobUrl(viewingQr.qrInfo!.qrImageUrl);
                } finally {
                    setIsQrLoading(false);
                }
            };
            loadQrImage();
        }

        return () => {
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }
            setQrBlobUrl(null);
        };
    }, [viewingQr]);

    const addTable = async () => {
        if (!newTableCode.trim()) return;
        if (tables.some(t => t.tableCode === newTableCode.trim())) {
            alert("이미 존재하는 테이블 이름입니다.");
            return;
        }

        try {
            await createTable(storePublicId, {
                tableCode: newTableCode.trim(),
                capacity: 4,
                status: 'ACTIVE'
            });
            setNewTableCode('');
            fetchData();
        } catch (error) {
            console.error("테이블 추가 실패", error);
            alert("추가 실패");
        }
    };

    const deleteTable = async (id: string) => {
        if (window.confirm("테이블을 삭제하시겠습니까?")) {
            try {
                await apiDeleteTable(storePublicId, id);
                fetchData();
            } catch (error) {
                console.error("테이블 삭제 실패", error);
                alert("삭제 실패");
            }
        }
    };

    const handleUpdateTable = async () => {
        if (!editingTable) return;
        try {
            await apiUpdateTable(storePublicId, editingTable.tablePublicId, {
                tableCode: editingTable.tableCode,
                capacity: editingTable.capacity,
                status: editingTable.status
            });
            setEditingTable(null);
            fetchData();
        } catch (error) {
            console.error("테이블 수정 실패", error);
            alert("테이블 수정에 실패했습니다.");
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAllSelection = () => {
        if (selectedIds.length === tables.length && tables.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(tables.map(t => t.tablePublicId));
        }
    };

    const formatDate = (isoString?: string) => {
        if (!isoString) return "-";
        const date = new Date(isoString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* 상단 일괄 액션바 */}
            {selectedIds.length > 0 && (
                <div className="fixed top-0 left-0 w-full z-[60] bg-indigo-600 text-white p-4 shadow-2xl animate-in slide-in-from-top duration-300 no-print">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                                {selectedIds.length} Selected
                            </span>
                            <h2 className="font-bold hidden sm:block italic">BATCH ACTION MODE</h2>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleIssueQrs(selectedIds)}
                                disabled={isActionLoading}
                                className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-black text-sm hover:bg-slate-100 transition-all flex items-center gap-2"
                            >
                                {isActionLoading ? <RefreshCcw size={16} className="animate-spin" /> : <QrCode size={16} />}
                                QR 일괄 발급
                            </button>
                            <button onClick={() => setSelectedIds([])} className="p-2 hover:bg-white/10 rounded-lg transition">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-slate-900 shadow-xl no-print relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none"></div>
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="flex items-center">
                        <div className="text-white">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-80">
                                관리 매장 식별 코드: {storePublicId}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl p-2 rounded-2xl flex items-center gap-2 border border-white/10 w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="새 테이블 추가 (예: 15, A-1)"
                            value={newTableCode}
                            onChange={(e) => setNewTableCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTable()}
                            className="bg-transparent text-white placeholder:text-slate-500 px-4 py-2 w-full focus:outline-none font-bold"
                        />
                        <button
                            onClick={addTable}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-2 shrink-0 shadow-lg"
                        >
                            <Plus size={18} /> 추가
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl w-full mx-auto px-6 py-12 space-y-20">
                {/* 섹션 1: 스마트 배치도 */}
                <section>
                    <div className="flex justify-between items-end mb-10">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
                                <Map size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Smart Floor Map</h2>
                                <p className="text-slate-500 text-sm mt-1">QR 아이콘을 클릭하여 코드를 미리보거나 상세 정보를 확인하세요.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {combinedData.map(table => (
                            <div
                                key={table.tablePublicId}
                                className={`group relative aspect-square rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center justify-center shadow-sm hover:shadow-2xl hover:-translate-y-2 ${table.status === 'ACTIVE' ? 'bg-white border-slate-100' : 'bg-slate-100 border-slate-200 grayscale opacity-60'}`}
                            >
                                <button
                                    onClick={() => toggleSelection(table.tablePublicId)}
                                    className={`absolute top-7 left-7 transition-all no-print z-20 ${selectedIds.includes(table.tablePublicId) ? 'text-indigo-600 scale-125' : 'text-slate-200 hover:text-slate-400'}`}
                                >
                                    {selectedIds.includes(table.tablePublicId) ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>

                                <div className="absolute top-7 right-7 no-print z-20">
                                    {table.qrInfo ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setViewingQr(table); }}
                                            className="p-1.5 bg-emerald-500 text-white rounded-lg border border-emerald-400 shadow-md hover:scale-110 transition-transform"
                                            title="QR 코드 보기"
                                        >
                                            <QrCode size={16} />
                                        </button>
                                    ) : (
                                        <div className="p-1.5 bg-rose-50 text-rose-300 rounded-lg border border-rose-100" title="QR 미발급">
                                            <AlertCircle size={16} />
                                        </div>
                                    )}
                                </div>

                                <span className="text-4xl font-black text-slate-800 mb-1">{table.tableCode}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${table.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{table.status}</span>
                                </div>

                                <div className="absolute inset-0 bg-slate-900/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity no-print flex items-end justify-center p-6 gap-2">
                                    {!table.qrInfo && (
                                        <button
                                            onClick={() => handleIssueQrs([table.tablePublicId])}
                                            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl transition-transform active:scale-90"
                                            title="QR 즉시 발급"
                                        >
                                            <QrCode size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => setEditingTable(table)} className="p-3 bg-white text-slate-700 rounded-2xl hover:bg-slate-900 hover:text-white shadow-xl transition-all">
                                        <Settings2 size={18} />
                                    </button>
                                    <button onClick={() => deleteTable(table.tablePublicId)} className="p-3 bg-white text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white shadow-xl transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 섹션 2: 상세 리스트 섹션 */}
                <section>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <button onClick={toggleAllSelection} className="p-2 text-slate-400 hover:text-indigo-600 transition no-print">
                                    {selectedIds.length === tables.length && tables.length > 0 ? <CheckSquare size={24} /> : <Square size={24} />}
                                </button>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Management List</h3>
                                    <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">Selected: {selectedIds.length} / Total: {tables.length}</p>
                                </div>
                            </div>
                            <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                <Printer size={20} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                                    <tr>
                                        <th className="px-10 py-6">Identity</th>
                                        <th className="px-10 py-6 text-center">Status</th>
                                        <th className="px-10 py-6 text-center">QR & Created At</th>
                                        <th className="px-10 py-6 text-right no-print">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {combinedData.map(t => (
                                        <tr key={t.tablePublicId} className={`hover:bg-indigo-50/30 transition-colors group ${selectedIds.includes(t.tablePublicId) ? 'bg-indigo-50/50' : ''}`}>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <button onClick={() => toggleSelection(t.tablePublicId)} className="no-print">
                                                        {selectedIds.includes(t.tablePublicId) ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-slate-200" />}
                                                    </button>
                                                    <div>
                                                        <span className="text-2xl font-black text-slate-800 tracking-tighter block leading-none">{t.tableCode}</span>
                                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 block">PID: {t.tablePublicId.slice(0, 10)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                {t.qrInfo ? (
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <button
                                                            onClick={() => setViewingQr(t)}
                                                            className="flex items-center gap-2 text-emerald-600 font-black text-[10px] tracking-wider hover:underline"
                                                        >
                                                            <CheckCircle2 size={14} /> CONNECTED
                                                        </button>
                                                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                                                            <Calendar size={10} />
                                                            {formatDate(t.qrInfo.createdAt)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleIssueQrs([t.tablePublicId])}
                                                        className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase tracking-widest border-b-2 border-indigo-200/50 hover:border-indigo-600 transition-all pb-0.5 no-print"
                                                    >
                                                        Issue QR Code
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-10 py-8 text-right no-print">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingTable(t)} className="p-2.5 text-slate-300 hover:text-slate-900 transition-all hover:bg-white rounded-lg shadow-sm"><Edit3 size={18} /></button>
                                                    <button onClick={() => deleteTable(t.tablePublicId)} className="p-2.5 text-slate-300 hover:text-rose-600 transition-all hover:bg-white rounded-lg shadow-sm"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>

            {/* QR 미리보기 모달 */}
            {viewingQr && viewingQr.qrInfo && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-6 no-print">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Table {viewingQr.tableCode} QR</h3>
                                <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-1">QR Code Preview</p>
                            </div>
                            <button onClick={() => setViewingQr(null)} className="text-slate-400 hover:text-white transition"><X size={24} /></button>
                        </div>
                        <div className="p-10 flex flex-col items-center">
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border-4 border-slate-100 shadow-inner mb-6 min-w-[12rem] min-h-[12rem] flex items-center justify-center">
                                {isQrLoading ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                ) : qrBlobUrl ? (
                                    <img
                                        src={qrBlobUrl}
                                        alt="Table QR Code"
                                        className="w-48 h-48"
                                    />
                                ) : (
                                    <div className="text-slate-400 text-[10px] font-black uppercase text-center">QR 이미지를<br />불러올 수 없습니다.</div>
                                )}
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">발급 일시</p>
                                <p className="text-slate-800 font-black text-sm">{formatDate(viewingQr.qrInfo.createdAt)}</p>
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="mt-8 w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                            >
                                QR 코드 인쇄하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingTable && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-slate-900 p-12 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter">Edit Table</h3>
                                <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-1">Property Tuning</p>
                            </div>
                            <button onClick={() => setEditingTable(null)} className="text-slate-500 hover:text-white transition"><X size={24} /></button>
                        </div>
                        <div className="p-12 space-y-10">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Table Label</label>
                                <input
                                    type="text"
                                    value={editingTable.tableCode}
                                    onChange={(e) => setEditingTable({ ...editingTable, tableCode: e.target.value })}
                                    className="w-full border-2 border-slate-100 rounded-[1.5rem] px-8 py-5 focus:border-indigo-500 focus:outline-none font-black text-3xl text-slate-800 transition-all shadow-inner bg-slate-50 focus:bg-white"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Status Configuration</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {(['ACTIVE', 'INACTIVE'] as const).map(st => (
                                        <button
                                            key={st}
                                            onClick={() => setEditingTable({ ...editingTable, status: st })}
                                            className={`px-6 py-5 rounded-[1.5rem] text-[11px] font-black transition-all border-2 ${editingTable.status === st
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105'
                                                : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                                                }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateTable}
                                className="w-full py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 mt-4 active:scale-95 uppercase"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="py-16 text-center no-print border-t border-slate-100 mt-20">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.6em]">Admin Dashboard &bull; Future Dining System</p>
            </footer>
        </div>
    );
};

export default DiningTablePage;
