import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Calendar,
    Clock,
    ChevronRight,
    LayoutList
} from 'lucide-react';
import { requireStorePublicId } from '@/utils/store.ts';

/**
 * 실사 재고 관리 시스템 리스트 컴포넌트
 */
const StocktakeListPage = () => {
    const navigate = useNavigate();

    // --- 데이터 상태 ---
    const storePublicId = requireStorePublicId();
    const [sheets] = useState([
        { sheetId: 1, title: "2월 정기 재고 실사", status: "CONFIRMED", confirmedAt: "2024-02-15T10:00:00Z", createdAt: "2024-02-15T09:00:00Z" },
        { sheetId: 2, title: "우유류 긴급 실사", status: "CONFIRMED", confirmedAt: "2024-02-20T15:30:00Z", createdAt: "2024-02-20T15:00:00Z" },
        { sheetId: 3, title: "주간 비품 체크", status: "DRAFT", confirmedAt: null, createdAt: "2024-02-22T13:45:00Z" },
    ]);

    // --- 비즈니스 로직: 리스트 관리 ---

    const handleCreateNew = () => {
        navigate("/inventory/stocktakes/new");
    };

    const handleViewDetail = (sheetId: number) => {
        console.log("View detail for sheet:", sheetId);
        // 향후 상세 페이지 가기: navigate(`/inventory/stocktakes/${sheetId}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "CONFIRMED":
                return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">확정됨</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">작성 중</span>;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* 네비게이션 헤더 */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-xl cursor-pointer">
                        <LayoutList size={28} />
                        <span>STOCK MASTER</span>
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
                            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                        >
                            <Plus size={20} />
                            신규 실사 생성
                        </button>
                    </div>

                    {/* 통계 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">전체 전표</p>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-slate-800">{sheets.length}</span>
                                <span className="text-slate-400 mb-1 text-sm font-medium">건</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">진행 중</p>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-amber-500">{sheets.filter(s => s.status === "DRAFT").length}</span>
                                <span className="text-slate-400 mb-1 text-sm font-medium">건</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">확정 완료</p>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-blue-500">{sheets.filter(s => s.status === "CONFIRMED").length}</span>
                                <span className="text-slate-400 mb-1 text-sm font-medium">건</span>
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
                                {sheets.map((sheet) => (
                                    <tr key={sheet.sheetId} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-800 group-hover:text-emerald-600 transition">{sheet.title}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">전표 번호: #{sheet.sheetId}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {getStatusBadge(sheet.status)}
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-slate-300" />
                                                {new Date(sheet.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-500">
                                            {sheet.confirmedAt ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={14} className="text-slate-300" />
                                                    {new Date(sheet.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            ) : "-"}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button
                                                onClick={() => handleViewDetail(sheet.sheetId)}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StocktakeListPage;
