import {useNavigate} from "react-router-dom";

export default function StockPage() {
    const navigate = useNavigate();

    // 샘플 데이터
    const stockItems = [
        {
            id: 1,
            name: "서울우유 1L",
            identifier: "Barcode: 8801111...",
            category: "유제품",
            currentStock: 45,
            unit: "EA",
            optimalStock: 20,
            expirationDate: "2024-05-28",
            status: "safe",
        },
        {
            id: 2,
            name: "국내산 삼겹살 1kg",
            identifier: "공급처: 글로벌 미트",
            category: "정육",
            currentStock: 2,
            unit: "KG",
            optimalStock: 10,
            expirationDate: "2024-05-23",
            status: "danger",
        },
        {
            id: 3,
            name: "청경채 (박스)",
            identifier: "신선식품 (냉장)",
            category: "채소",
            currentStock: 3,
            unit: "BOX",
            optimalStock: 2,
            expirationDate: "2024-05-22 (내일)",
            status: "warning",
        },
        {
            id: 4,
            name: "백설 참기름 1.8L",
            identifier: "Barcode: 880222...",
            category: "식재료",
            currentStock: 8,
            unit: "EA",
            optimalStock: 5,
            expirationDate: "2025-01-10",
            status: "safe",
        },
    ];

    const getStatusTagClass = (status: string) => {
        switch (status) {
            case "danger":
                return "tag-danger";
            case "warning":
                return "tag-warning";
            case "safe":
            default:
                return "tag-safe";
        }
    };

    return (
        <div className="flex flex-col space-y-6">
            {/* 페이지 헤더 */}
            <div className="bg-[#1a1a1a] h-16 flex items-center justify-between px-6 shadow-md rounded-xl z-10">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <i className="ph-fill ph-stack text-white text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">
                                재고<span className="text-gray-400">관리</span>
                            </h1>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                                Inventory Master
                            </p>
                        </div>
                    </div>

                    {/* 페이지 메뉴 */}
                    <div className="flex gap-6 h-16">
                        <button
                            className="flex items-center px-2 text-sm font-bold text-white border-b-2 border-white transition-all">
                            재고 현황
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-300 hover:text-white border border-gray-700 rounded-lg transition-all">
                        <i className="ph ph-barcode"></i> 바코드 스캔
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md">
                        <i className="ph ph-download-simple"></i> 재고 실사표 출력
                    </button>
                </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="space-y-6">
                {/* 재고 요약 대시보드 */}
                <div className="grid grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                            전체 품목
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-gray-800">428</span>
                            <span className="text-xs text-gray-400 font-medium">종류</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-[10px] font-bold text-red-500 uppercase mb-1">
                            재고 부족
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-red-600">12</span>
                            <span className="text-xs text-gray-400 font-medium">품목</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-[10px] font-bold text-orange-500 uppercase mb-1">
                            유통기한 임박
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-orange-600">07</span>
                            <span className="text-xs text-gray-400 font-medium">
                품목 (3일 내)
              </span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                            총 재고 자산
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-gray-800">₩14.2M</span>
                        </div>
                    </div>
                </div>

                {/* 검색 및 고급 필터 */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="relative flex-1">
                        <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="품목명, 바코드, 카테고리 검색..."
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer">
                            <option>전체 카테고리</option>
                            <option>육류/냉동</option>
                            <option>채소/신선</option>
                            <option>소스/조미료</option>
                            <option>가공식품</option>
                        </select>
                        <select
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer text-red-600">
                            <option>필터: 전체 보기</option>
                            <option>재고 부족 품목만</option>
                            <option>유통기한 임박 품목만</option>
                        </select>
                    </div>
                </div>

                {/* 재고 리스트 */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                                품목 정보
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                                카테고리
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                                현재 재고
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                                적정 재고
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                                유통기한
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                                상태
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider">
                                관리
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {stockItems.map((item) => (
                            <tr
                                key={item.id}
                                className={`hover:bg-gray-50 transition-colors ${
                                    item.status === "danger"
                                        ? "bg-red-50/30"
                                        : item.status === "warning"
                                            ? "bg-orange-50/30"
                                            : ""
                                }`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                            <i className="ph ph-image text-xl"></i>
                                        </div>
                                        <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-[13px]">
                          {item.name}
                        </span>
                                            <span className="text-[10px] text-gray-400">
                          {item.identifier}
                        </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-medium">
                                    {item.category}
                                </td>
                                <td className="px-6 py-4">
                    <span
                        className={`text-[13px] font-black ${
                            item.status === "danger" ? "text-red-600" : "text-gray-800"
                        }`}
                    >
                      {item.currentStock}
                    </span>{" "}
                                    <span className="text-gray-400">{item.unit}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-400 font-medium">
                                    {item.optimalStock} {item.unit}
                                </td>
                                <td
                                    className={`px-6 py-4 font-medium ${
                                        item.status === "warning" ? "text-orange-600 font-black" : "text-gray-600"
                                    }`}
                                >
                                    {item.expirationDate}
                                </td>
                                <td className="px-6 py-4">
                    <span
                        className={`stock-tag ${getStatusTagClass(item.status)}`}
                    >
                      {item.status === "danger"
                          ? "재고부족"
                          : item.status === "warning"
                              ? "기한 임박"
                              : "정상"}
                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {item.status === "danger" ? (
                                        <button
                                            className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg text-[10px] hover:bg-red-700 transition-all">
                                            즉시 발주
                                        </button>
                                    ) : item.status === "warning" ? (
                                        <button
                                            onClick={() => navigate("/stock/disposal")}
                                            className="px-3 py-1.5 bg-orange-500 text-white font-bold rounded-lg text-[10px] hover:bg-orange-600 transition-all"
                                        >
                                            폐기 처리
                                        </button>
                                    ) : (
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                            <i className="ph ph-dots-three-vertical text-lg"></i>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* 페이지네이션 */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Total 428 Items
                        </p>
                        <div className="flex gap-1">
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-black transition-all">
                                <i className="ph ph-caret-left"></i>
                            </button>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                                1
                            </button>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 font-bold text-xs">
                                2
                            </button>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 font-bold text-xs">
                                3
                            </button>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-black transition-all">
                                <i className="ph ph-caret-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 푸터 바 */}
            <footer
                className="h-10 bg-white border-t border-gray-200 flex items-center justify-between px-6 text-[10px] text-gray-400 font-medium uppercase tracking-tighter shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    마지막 업데이트:{" "}
                    <span className="text-blue-500 font-bold ml-1">오늘 14:22:05</span>
                </div>
                <div className="flex gap-6">
          <span className="hover:text-black cursor-pointer transition-colors">
            시스템 설정
          </span>
                    <span className="hover:text-black cursor-pointer transition-colors">
            데이터 백업
          </span>
                    <span className="hover:text-black cursor-pointer transition-colors">
            v1.2.0
          </span>
                </div>
            </footer>
        </div>
    );
}
