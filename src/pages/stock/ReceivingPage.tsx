import {useNavigate} from "react-router-dom";

export default function ReceivingPage() {
    const navigate = useNavigate();

    // 샘플 데이터
    const stockItems = [
        {
            id: 1,
            date: "2024-05-21",
            vendor: "에이치 식자재 컴퍼니",
            items: "냉동 닭가슴살 외 2건",
            totalAmount: "85,400",
            status: "completed",
        },
        {
            id: 2,
            date: "2024-05-20",
            vendor: "동국 농산",
            items: "햇양파 20kg 외 5건",
            totalAmount: "212,000",
            status: "completed",
        },
        {
            id: 3,
            date: "2024-05-21",
            vendor: "글로벌 미트",
            items: "한돈 삼겹살 10kg",
            totalAmount: "340,000",
            status: "pending",
        },
        {
            id: 4,
            date: "2024-05-18",
            vendor: "샘표 상사",
            items: "양조간장 18L 외 1건",
            totalAmount: "45,000",
            status: "completed",
        },
    ];

    return (
        <div className="flex flex-col space-y-6">
            {/* 페이지 헤더 (Black Theme) */}
            <div className="bg-[#1a1a1a] h-16 flex items-center justify-between px-6 shadow-md rounded-xl">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <i className="ph-fill ph-package text-[#1a1a1a] text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">
                                입고<span className="text-gray-400">관리</span>
                            </h1>
                        </div>
                    </div>

                    {/* 페이지 메뉴 */}
                    <div className="flex gap-6 h-16">
                        <button
                            className="flex items-center px-2 text-sm font-bold text-white border-b-2 border-white transition-all"
                        >
                            입고 내역
                        </button>
                        <button
                            onClick={() => navigate("/stock/receiveRegister")}
                            className="flex items-center px-2 text-sm font-bold text-gray-400 hover:text-white transition-all"
                        >
                            입고 등록
                        </button>
                        <button
                            onClick={() => navigate("/stock/documents")}
                            className="flex items-center px-2 text-sm font-bold text-gray-400 hover:text-white transition-all"
                        >
                            증빙 보관함
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex bg-gray-800 rounded-lg p-1">
                        <button className="px-4 py-1.5 text-xs font-bold text-white bg-gray-700 rounded-md shadow-sm">
                            전체보기
                        </button>
                        <button
                            className="px-4 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                            미확정
                        </button>
                    </div>
                    <div className="w-px h-8 bg-gray-700 mx-1"></div>
                </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="space-y-6">
                {/* 상단 요약 카드 (3컬럼) */}
                <div className="grid grid-cols-3 gap-6">
                    <div
                        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                                이달의 총 입고 건수
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-gray-800">128</span>
                                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <i className="ph ph-caret-up"></i> 12%
                </span>
                            </div>
                        </div>
                        <div
                            className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <i className="ph-fill ph-trend-up text-2xl"></i>
                        </div>
                    </div>
                    <div
                        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                                검수 및 확정 대기
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-amber-500">05</span>
                                <span className="text-xs font-bold text-gray-400">건 미확정</span>
                            </div>
                        </div>
                        <div
                            className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <i className="ph-fill ph-clock-countdown text-2xl"></i>
                        </div>
                    </div>
                    <div
                        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                                총 매입액 (5월 기준)
                            </p>
                            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">
                  ₩4.25M
                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center">
                            <i className="ph-fill ph-bank text-2xl"></i>
                        </div>
                    </div>
                </div>

                {/* 검색 및 필터 */}
                <div
                    className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="공급처 또는 품목명 검색..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-black focus:bg-white transition-all"
                            />
                        </div>
                        <div
                            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                            <i className="ph ph-calendar text-gray-400"></i>
                            <input
                                type="date"
                                className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                            />
                            <span className="text-gray-300">~</span>
                            <input
                                type="date"
                                className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                            <i className="ph ph-export"></i> 엑셀 출력
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 bg-white">
                            <i className="ph ph-funnel"></i> 상세 필터
                        </button>
                    </div>
                </div>

                {/* 리스트 테이블 */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                                입고일자
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                                공급처
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                                대표품목
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-right">
                                총 금액
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-center">
                                상태
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-center">
                                상세
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {stockItems.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => navigate(`/stock/receiving?id=${item.id}`)}
                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                                    item.status === "pending" ? "bg-amber-50/20" : ""
                                }`}
                            >
                                <td className="px-6 py-4 font-medium text-gray-600 text-[11px]">
                                    {item.date}
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-800">
                                    {item.vendor}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{item.items}</td>
                                <td className="px-6 py-4 font-bold text-gray-900 text-right">
                                    ₩{item.totalAmount}
                                </td>
                                <td className="px-6 py-4 text-center">
                    <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            item.status === "completed"
                                ? "bg-[#ecfdf5] text-[#10b981]"
                                : "bg-[#fffbeb] text-[#f59e0b]"
                        }`}
                    >
                      {item.status === "completed" ? "입고확정" : "검수대기"}
                    </span>
                                </td>
                                <td className="px-6 py-4 text-center text-gray-300">
                                    <i className="ph ph-caret-right text-lg"></i>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* 페이지네이션 */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Showing 4 of 48 records
                        </p>
                        <div className="flex gap-1">
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 transition-all">
                                <i className="ph ph-caret-left"></i>
                            </button>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-black text-white font-bold text-xs">
                                1
                            </button>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs transition-all">
                                2
                            </button>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs transition-all">
                                3
                            </button>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 transition-all">
                                <i className="ph ph-caret-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
