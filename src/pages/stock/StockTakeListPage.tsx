import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Calendar,
    ChevronRight,
    Loader2,
    ClipboardList,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { requireStorePublicId } from '@/utils/store.ts';
import { getStockTakeSheets } from '@/api/stock/stockTake';
import type { StockTakeSheetResponse } from '@/types/stock/stockTake';

/**
 * 실사 재고 관리 시스템 리스트 컴포넌트
 */
const StockTakeListPage = () => {
    const navigate = useNavigate();

    // --- 데이터 상태 ---
    const storePublicId = requireStorePublicId();
    const [sheets, setSheets] = useState<StockTakeSheetResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSheets = async () => {
            setIsLoading(true);
            try {
                const data = await getStockTakeSheets(storePublicId);
                setSheets(data);
            } catch (error) {
                console.error("실사 내역 로드 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSheets();
    }, [storePublicId]); // The original dependency array was correct for fetching all sheets based on storePublicId.
    // The requested change    }, [title, items, sheetPublicId, status, storePublicId]);`
    // would introduce undefined variables (`title`, `items`, `status`) in this scope,
    // and `sheetPublicId` is not a dependency for fetching *all* sheets.
    // Assuming the intent was to fix a lint error related to `storePublicId`
    // and keep the logic for fetching all sheets, the current `[storePublicId]` is correct.
    // If this `useEffect` was intended for a single sheet, the component name and API call would be different.

    // --- 비즈니스 로직: 리스트 관리 ---

    const handleCreateNew = () => {
        navigate("/stock/stocktakes/new");
    };

    const handleViewDetail = (sheetPublicId: string) => {
        navigate(`/stock/stocktakes/${sheetPublicId}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "CONFIRMED":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-black tracking-tight border border-blue-100 uppercase">
                        <CheckCircle2 size={12} />
                        확정 완료
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-black tracking-tight border border-slate-200 uppercase">
                        <Clock size={12} />
                        작성 중
                    </span>
                );
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* 네비게이션 헤더 */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 text-black font-black text-xl cursor-default uppercase tracking-tighter">
                        <span>재고 실사 관리</span>
                    </div>
                    <div className="text-sm font-medium text-slate-400">
                        매장 코드: <span className="text-slate-800">{storePublicId.substring(0, 8)}</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-6">
                <div className="animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">재고 실사 내역</h1>
                            <p className="text-slate-500 text-sm mt-1">이전에 작성된 실사 전표를 확인하거나 새로 작성합니다.</p>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                        >
                            <Plus size={20} />
                            신규 실사 생성
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">전체 실사 전표</p>
                                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                                    <ClipboardList size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{sheets.length}</span>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">건</span>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">작성 진행 중</p>
                                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                                    <Plus size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-4xl font-black text-emerald-500 tracking-tighter">{sheets.filter(s => s.status === "DRAFT").length}</span>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">건</span>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">확정 완료 내역</p>
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                    <CheckCircle2 size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-4xl font-black text-blue-500 tracking-tighter">{sheets.filter(s => s.status === "CONFIRMED").length}</span>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">건</span>
                            </div>
                        </div>
                    </div>

                    {/* 테이블 리스트 */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
                                    <th className="px-6 py-4">실사 정보</th>
                                    <th className="px-6 py-4">상태</th>
                                    <th className="px-6 py-4">작성일</th>
                                    <th className="px-6 py-4">확정일</th>
                                    <th className="px-6 py-4 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="animate-spin text-slate-200" size={40} />
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-black text-slate-800 uppercase tracking-tighter text-lg">데이터 분석 중</p>
                                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">목록을 성공적으로 불러오고 있습니다.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : sheets.length > 0 ? (
                                    sheets.map((sheet) => (
                                        <tr key={sheet.sheetPublicId} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-black group-hover:text-white transition-all">
                                                        <ClipboardList size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-lg text-slate-800 tracking-tighter leading-none group-hover:text-black transition">{sheet.title}</div>
                                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 block"> 전표 PID: {sheet.sheetPublicId.substring(0, 12).toUpperCase()} </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                {getStatusBadge(sheet.status)}
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">생성일</p>
                                                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                                        <Calendar size={14} className="text-slate-300" />
                                                        {new Date(sheet.createdAt).toLocaleDateString('ko-KR')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">상태 업데이트</p>
                                                    <div className="text-xs font-bold text-slate-400">
                                                        {sheet.status === 'CONFIRMED' ? '최종 확정됨' : '현재 작성 중'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center">
                                                <button
                                                    onClick={() => handleViewDetail(sheet.sheetPublicId)}
                                                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:bg-black hover:text-white hover:border-black rounded-xl transition-all shadow-sm mx-auto"
                                                    title="상세 보기"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-40 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <AlertCircle size={48} className="text-slate-400" />
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-black text-slate-800 uppercase tracking-tighter text-lg">기록된 전표 없음</p>
                                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">새로운 재고 실사를 시작해 보세요.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StockTakeListPage;
