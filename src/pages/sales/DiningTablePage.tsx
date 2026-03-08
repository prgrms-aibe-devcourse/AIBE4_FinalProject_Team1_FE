import { useState, useEffect, useMemo } from 'react';
import {
    Map as MapIcon,
    Printer,
    Trash2,
    Edit3,
    X,
    Plus,
    Loader2,
    QrCode,
    RefreshCcw,
    CheckSquare,
    Square,
    Calendar
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
            <div className="min-h-screen flex items-center justify-center bg-white">
                <p className="font-bold text-gray-500">데이터를 불러오는 중입니다...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">

            {/* 상단 일괄 액션바 */}
            {selectedIds.length > 0 && (
                <div className="fixed top-0 left-0 w-full z-[60] bg-black text-white p-4 shadow-2xl animate-in slide-in-from-top duration-300 no-print">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                                {selectedIds.length}개 선택됨
                            </span>
                            <h2 className="font-bold hidden sm:block italic">일괄 작업 모드</h2>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleIssueQrs(selectedIds)}
                                disabled={isActionLoading}
                                className="bg-white text-black px-6 py-2 rounded-xl font-black text-sm hover:bg-slate-100 transition-all flex items-center gap-2"
                            >
                                <QrCode size={18} />
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
            <header className="bg-white border-b border-gray-200 no-print relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="flex items-center">
                        <div className="text-black">
                            <h1 className="text-3xl font-black text-black tracking-tight uppercase">테이블 마스터 관리</h1>
                            <p className="text-gray-500 text-sm mt-1 font-bold">QR 코드를 생성하고 배치도를 관리하세요.</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded-2xl flex items-center gap-2 border border-gray-200 w-full max-w-sm">
                        <div className="pl-4 text-gray-400">
                            <Plus size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="새 테이블 추가 (예: 15, A-1)"
                            value={newTableCode}
                            onChange={(e) => setNewTableCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTable()}
                            className="bg-transparent text-gray-900 placeholder:text-gray-400 px-2 py-2 w-full focus:outline-none font-bold"
                        />
                        <button
                            onClick={addTable}
                            className="bg-black text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2 shrink-0 shadow-lg"
                        >
                            추가
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl w-full mx-auto px-6 py-12 space-y-20">
                {/* 섹션 1: 스마트 배치도 */}
                <section>
                    <div className="flex justify-between items-end mb-10">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-black text-white rounded-2xl shadow-xl">
                                <MapIcon size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-black tracking-tight uppercase">디지털 테이블 배치도</h1>
                                <p className="text-gray-500 text-sm mt-1 font-bold">테이블을 클릭하여 상세 정보를 확인하거나 QR 코드를 관리하세요.</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchData}
                            className="p-3 text-slate-400 hover:text-black hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md"
                            title="새로고침"
                        >
                            <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {combinedData.map(table => (
                            <div
                                key={table.tablePublicId}
                                className={`group relative aspect-square rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center justify-center shadow-sm hover:shadow-2xl hover:-translate-y-2 ${table.status === 'ACTIVE' ? 'bg-white border-slate-100' : 'bg-slate-100 border-slate-200 grayscale opacity-60'}`}
                            >
                                <div className="absolute top-7 left-7 flex gap-2 no-print z-20">
                                    <button
                                        onClick={() => toggleSelection(table.tablePublicId)}
                                        className={`transition-all ${selectedIds.includes(table.tablePublicId) ? 'text-black scale-125' : 'text-slate-200 hover:text-slate-400'}`}
                                    >
                                        {selectedIds.includes(table.tablePublicId) ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
                                </div>

                                <div className="absolute top-7 right-7 no-print z-20">
                                    {table.qrInfo ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setViewingQr(table); }}
                                            className="px-2 py-1 bg-green-600 text-white text-[10px] font-bold rounded-lg shadow-md hover:scale-110 transition-transform flex items-center gap-1"
                                        >
                                            <QrCode size={10} />
                                            QR 보기
                                        </button>
                                    ) : (
                                        <div className="px-2 py-1 bg-red-50 text-red-500 text-[10px] font-bold rounded-lg border border-red-100">
                                            미발급
                                        </div>
                                    )}
                                </div>

                                <span className="text-4xl font-black text-slate-800 mb-1">{table.tableCode}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${table.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{table.status === 'ACTIVE' ? '활성' : '비활성'}</span>
                                </div>

                                <div className="absolute inset-0 bg-slate-900/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity no-print flex items-end justify-center p-6 gap-2">
                                    {!table.qrInfo && (
                                        <button
                                            onClick={() => handleIssueQrs([table.tablePublicId])}
                                            className="px-3 py-2 bg-black text-white text-[11px] font-bold rounded-xl hover:bg-gray-800 shadow-xl transition-all flex items-center gap-1.5"
                                        >
                                            <QrCode size={12} />
                                            QR 발급
                                        </button>
                                    )}
                                    <button onClick={() => setEditingTable(table)} className="px-3 py-2 bg-white text-slate-700 text-[11px] font-bold rounded-xl hover:bg-slate-900 hover:text-white shadow-xl transition-all">
                                        수정
                                    </button>
                                    <button onClick={() => deleteTable(table.tablePublicId)} className="px-3 py-2 bg-white text-red-600 text-[11px] font-bold rounded-xl hover:bg-red-600 hover:text-white shadow-xl transition-all">
                                        삭제
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
                                <button onClick={toggleAllSelection} className="p-2 text-slate-400 hover:text-black transition no-print font-bold">
                                    {selectedIds.length === tables.length && tables.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight uppercase leading-none">테이블 관리 리스트</h3>
                                    <p className="text-[10px] text-gray-500 mt-2 font-black uppercase tracking-widest">선택됨: {selectedIds.length} / 전체: {tables.length}</p>
                                </div>
                            </div>
                            <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm font-bold text-xs flex items-center gap-2">
                                <Printer size={14} />
                                인쇄하기
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 text-gray-500 text-[11px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                                    <tr>
                                        <th className="px-10 py-6">식별 정보</th>
                                        <th className="px-10 py-6 text-center">상태</th>
                                        <th className="px-10 py-6 text-center">QR 및 생성 일시</th>
                                        <th className="px-10 py-6 text-right no-print">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {combinedData.map(t => (
                                        <tr key={t.tablePublicId} className={`hover:bg-gray-50 transition-colors group ${selectedIds.includes(t.tablePublicId) ? 'bg-gray-100' : ''}`}>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <button onClick={() => toggleSelection(t.tablePublicId)} className="no-print font-bold">
                                                        {selectedIds.includes(t.tablePublicId) ? <CheckSquare size={18} /> : <Square size={18} />}
                                                    </button>
                                                    <div>
                                                        <span className="text-2xl font-black text-slate-800 tracking-tighter block leading-none">{t.tableCode}</span>
                                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 block">PID: {t.tablePublicId.slice(0, 10)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'ACTIVE' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                                    {t.status === 'ACTIVE' ? '활성' : '비활성'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                {t.qrInfo ? (
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <button
                                                            onClick={() => setViewingQr(t)}
                                                            className="flex items-center gap-2 text-green-600 font-black text-[10px] tracking-wider hover:underline"
                                                        >
                                                            연결됨
                                                        </button>
                                                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                                                            <Calendar size={10} />
                                                            {formatDate(t.qrInfo.createdAt)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleIssueQrs([t.tablePublicId])}
                                                        className="text-black hover:text-gray-800 text-[10px] font-black uppercase tracking-widest border-b-2 border-gray-200 hover:border-black transition-all pb-0.5 no-print"
                                                    >
                                                        QR 코드 발급
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-10 py-8 text-right no-print">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingTable(t)} className="px-3 py-1.5 text-slate-500 hover:text-black transition-all font-bold text-xs border border-gray-200 rounded-lg flex items-center gap-1">
                                                        <Edit3 size={12} />
                                                        수정
                                                    </button>
                                                    <button onClick={() => deleteTable(t.tablePublicId)} className="px-3 py-1.5 text-red-500 hover:text-red-700 transition-all font-bold text-xs border border-gray-200 rounded-lg flex items-center gap-1">
                                                        <Trash2 size={12} />
                                                        삭제
                                                    </button>
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
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 no-print">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-black p-8 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">테이블 {viewingQr.tableCode} QR</h3>
                                <p className="text-gray-400 text-[10px] font-black tracking-widest uppercase mt-1">QR 코드 미리보기</p>
                            </div>
                            <button onClick={() => setViewingQr(null)} className="text-gray-400 hover:text-white transition font-bold p-1">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-10 flex flex-col items-center">
                            <div className="bg-gray-50 p-6 rounded-[2.5rem] border-4 border-gray-100 shadow-inner mb-6 min-w-[12rem] min-h-[12rem] flex items-center justify-center">
                                {isQrLoading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="animate-spin text-gray-300" size={32} />
                                        <p className="font-bold text-gray-400 text-xs text-center">QR 이미지를<br />불러오는 중...</p>
                                    </div>
                                ) : qrBlobUrl ? (
                                    <img
                                        src={qrBlobUrl}
                                        alt="Table QR Code"
                                        className="w-48 h-48"
                                    />
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center gap-2">
                                        <QrCode size={32} className="opacity-10" />
                                        <div className="text-[10px] font-black uppercase text-center">QR 이미지를<br />불러올 수 없습니다.</div>
                                    </div>
                                )}
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">발급 일시</p>
                                <p className="text-gray-800 font-black text-sm">{formatDate(viewingQr.qrInfo.createdAt)}</p>
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="mt-8 w-full py-4 rounded-2xl bg-black text-white font-black text-xs tracking-widest hover:bg-gray-800 transition-all shadow-xl active:scale-95"
                            >
                                QR 코드 인쇄하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingTable && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-black p-12 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter">테이블 정보 수정</h3>
                                <p className="text-gray-400 text-[10px] font-black tracking-widest uppercase mt-1">설정 최적화</p>
                            </div>
                            <button onClick={() => setEditingTable(null)} className="text-gray-400 hover:text-white transition font-bold text-xl">닫기</button>
                        </div>
                        <div className="p-12 space-y-10">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">테이블 코드</label>
                                <input
                                    type="text"
                                    value={editingTable.tableCode}
                                    onChange={(e) => setEditingTable({ ...editingTable, tableCode: e.target.value })}
                                    className="w-full border-2 border-gray-100 rounded-[1.5rem] px-8 py-5 focus:border-black focus:outline-none font-black text-3xl text-slate-800 transition-all shadow-inner bg-gray-50 focus:bg-white"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">상태 설정</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {(['ACTIVE', 'INACTIVE'] as const).map(st => (
                                        <button
                                            key={st}
                                            onClick={() => setEditingTable({ ...editingTable, status: st })}
                                            className={`px-6 py-5 rounded-[1.5rem] text-[11px] font-bold transition-all border-2 ${editingTable.status === st
                                                ? 'bg-black border-black text-white shadow-2xl scale-105'
                                                : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                                }`}
                                        >
                                            {st === 'ACTIVE' ? '활성 (ACTIVE)' : '비활성 (INACTIVE)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateTable}
                                className="w-full py-6 rounded-[1.5rem] bg-black text-white font-black text-sm tracking-widest hover:bg-gray-800 transition-all shadow-xl mt-4 active:scale-95 uppercase"
                            >
                                저장하기
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
