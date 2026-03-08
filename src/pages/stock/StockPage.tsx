import {useState, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import {getStoreStockSummary} from "@/api/stock/stock";
import type {StockSummaryResponse, StockSearchCondition} from "@/types/stock/stock";
import {requireStorePublicId} from "@/utils/store.ts";

export default function StockPage() {
    const navigate = useNavigate();
    const storePublicId = requireStorePublicId();

    // --- 상태 관리 ---
    const [items, setItems] = useState<StockSummaryResponse[]>([]);
    const [page, setPage] = useState(0); // 현재 페이지 (0부터 시작)
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const [condition, setCondition] = useState<StockSearchCondition>({
        ingredientName: '',
        includeZeroStock: true
    });

    // --- 데이터 패칭 (페이지 번호 방식) ---
    const fetchStockData = async (targetPage: number) => {
        if (!storePublicId) return;
        setLoading(true);
        try {
            // 한 페이지당 15개씩 노출
            const response = await getStoreStockSummary(storePublicId, condition, targetPage, 15);
            setItems(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            setPage(response.page);
        } catch (error) {
            console.error("재고 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    // 검색 조건 변경 시 1페이지로 리셋하며 호출
    useEffect(() => {
        fetchStockData(0);
    }, [condition.ingredientName, condition.includeZeroStock, storePublicId]);

    // 페이지 번호 클릭 핸들러
    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            fetchStockData(newPage);
            // 페이지 이동 시 상단으로 스크롤 (옵션)
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="flex flex-col space-y-6">
            {/* 상단 헤더 및 검색 바 (이전과 동일) */}
            <div className="bg-[#1a1a1a] h-16 flex items-center justify-between px-6 shadow-md rounded-xl">
                <h1 className="text-lg font-bold text-white">재고 관리</h1>
                <button onClick={() => navigate(`/stock/${storePublicId}/disposal`)}
                        className="px-4 py-2 text-sm font-bold text-white bg-orange-600 rounded-lg shadow-md">
                    폐기 관리 페이지 이동
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border flex items-center gap-4">
                <input
                    type="text"
                    placeholder="품목명 검색..."
                    className="flex-1 px-4 py-3 bg-gray-50 border rounded-xl text-sm"
                    onChange={(e) => setCondition(prev => ({...prev, ingredientName: e.target.value}))}
                />
            </div>

            {/* 재고 리스트 테이블 */}
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-4 font-bold text-gray-500">품목 정보</th>
                        <th className="px-6 py-4 font-bold text-gray-500">현재 총 재고</th>
                        <th className="px-6 py-4 font-bold text-gray-500">가용 배치 수</th>
                        <th className="px-6 py-4 font-bold text-gray-500">유통기한</th>
                        <th className="px-6 py-4 font-bold text-gray-500 text-center">관리</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="py-20 text-center text-gray-400">데이터를 로드 중입니다...</td>
                        </tr>
                    ) : (
                        items.map((item) => (
                            <tr key={item.ingredientId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-800">{item.ingredientName}</td>
                                <td className="px-6 py-4"><span
                                    className="font-black">{item.totalRemainingQuantity}</span> {item.unit}</td>
                                <td className="px-6 py-4">{item.batchCount}개</td>
                                <td className="px-6 py-4">{item.minExpirationDate || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => navigate(`/stock/${storePublicId}/disposal?id=${item.ingredientId}`)}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] hover:bg-orange-500 hover:text-white">
                                        폐기 관리
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>

                {/* --- 페이지네이션 UI --- */}
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                        Total {totalElements} Items | Page {page + 1} of {totalPages}
                    </p>
                    <div className="flex gap-1">
                        <button
                            disabled={page === 0}
                            onClick={() => handlePageChange(page - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 disabled:opacity-30">
                            <i className="ph ph-caret-left"></i>
                        </button>

                        {/* 페이지 번호들 (간단한 구현) */}
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => handlePageChange(i)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-all ${
                                    page === i ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}>
                                {i + 1}
                            </button>
                        )).slice(Math.max(0, page - 2), Math.min(totalPages, page + 3))}

                        <button
                            disabled={page === totalPages - 1}
                            onClick={() => handlePageChange(page + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 disabled:opacity-30">
                            <i className="ph ph-caret-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}