import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Calendar,
    ChevronRight,
    Loader2,
    ClipboardList,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    ChevronLeft
} from 'lucide-react';
import { requireStorePublicId } from '@/utils/store.ts';
import { getStockTakeSheets } from '@/api/stock/stockTake';
import type { PageResponse } from '@/types/common/common';
import type { StockTakeSheetResponse } from '@/types/stock/stockTake';

/**
 * 실사 재고 관리 시스템 리스트 컴포넌트
 */
const StockTakeListPage = () => {
    const navigate = useNavigate();
    const storePublicId = requireStorePublicId();

    const [sheetPage, setSheetPage] = useState<PageResponse<StockTakeSheetResponse>>({
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    // 입력값 상태
    const [title, setTitle] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    // 실제 검색 상태
    const [searchTitle, setSearchTitle] = useState('');
    const [searchFrom, setSearchFrom] = useState('');
    const [searchTo, setSearchTo] = useState('');

    const [page, setPage] = useState(0);
    const size = 10;

    const sheets = sheetPage.content;

    const toOffsetDateTimeString = (value: string) => {
        if (!value) return undefined;
        return new Date(value).toISOString();
    };

    useEffect(() => {
        const fetchSheets = async () => {
            setIsLoading(true);
            try {
                const data = await getStockTakeSheets(storePublicId, {
                    title: searchTitle.trim() || undefined,
                    from: toOffsetDateTimeString(searchFrom),
                    to: toOffsetDateTimeString(searchTo),
                    page,
                    size,
                });
                setSheetPage(data);
            } catch (error) {
                console.error('실사 내역 로드 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSheets();
    }, [storePublicId, searchTitle, searchFrom, searchTo, page, size]);

    const handleCreateNew = () => {
        navigate('/stock/stocktakes/new');
    };

    const handleViewDetail = (sheetPublicId: string) => {
        navigate(`/stock/stocktakes/${sheetPublicId}`);
    };

    const handleSearch = () => {
        setPage(0);
        setSearchTitle(title);
        setSearchFrom(from);
        setSearchTo(to);
    };

    const handleReset = () => {
        setTitle('');
        setFrom('');
        setTo('');
        setSearchTitle('');
        setSearchFrom('');
        setSearchTo('');
        setPage(0);
    };

    const draftCount = useMemo(
        () => sheets.filter((sheet) => sheet.status === 'DRAFT').length,
        [sheets]
    );

    const confirmedCount = useMemo(
        () => sheets.filter((sheet) => sheet.status === 'CONFIRMED').length,
        [sheets]
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
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
        <div className="bg-slate-50 min-h-screen pt-10">

            <main className="max-w-6xl mx-auto p-6">
                <div className="animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900">재고 실사 내역</h1>
                            <p className="mt-3 text-sm text-gray-500">
                                이전에 작성된 실사 전표를 확인하거나 새로 작성합니다.
                            </p>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                        >
                            <Plus size={20} />
                            신규 실사 생성
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    제목 검색
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="실사 제목을 입력하세요"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    시작 일시
                                </label>
                                <input
                                    type="datetime-local"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    종료 일시
                                </label>
                                <input
                                    type="datetime-local"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleSearch}
                                className="px-5 py-3 rounded-xl bg-black text-white text-sm font-black hover:bg-slate-800 transition"
                            >
                                검색
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-black hover:bg-slate-50 transition"
                            >
                                초기화
                            </button>
                        </div>
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
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{sheetPage.totalElements}</span>
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
                                <span className="text-4xl font-black text-emerald-500 tracking-tighter">{draftCount}</span>
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
                                <span className="text-4xl font-black text-blue-500 tracking-tighter">{confirmedCount}</span>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">건</span>
                            </div>
                        </div>
                    </div>

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
                                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                        목록을 성공적으로 불러오고 있습니다.
                                                    </p>
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
                                                        <div className="font-black text-lg text-slate-800 tracking-tighter leading-none group-hover:text-black transition">
                                                            {sheet.title}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 block">
                                                            전표 PID: {sheet.sheetPublicId.substring(0, 12).toUpperCase()}
                                                        </div>
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
                                                        {new Date(sheet.createdAt).toLocaleString('ko-KR')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">확정일</p>
                                                    <div className="text-xs font-bold text-slate-400">
                                                        {sheet.confirmedAt
                                                            ? new Date(sheet.confirmedAt).toLocaleString('ko-KR')
                                                            : '미확정'}
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
                                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                        새로운 재고 실사를 시작해 보세요.
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!isLoading && sheetPage.totalPages > 0 && (
                        <div className="flex items-center justify-center gap-3 mt-8">
                            <button
                                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                                disabled={page === 0}
                                className="w-11 h-11 rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="px-4 py-2 text-sm font-bold text-slate-600">
                                {sheetPage.page + 1} / {sheetPage.totalPages}
                            </div>

                            <button
                                onClick={() => setPage((prev) => (sheetPage.hasNext ? prev + 1 : prev))}
                                disabled={!sheetPage.hasNext}
                                className="w-11 h-11 rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StockTakeListPage;