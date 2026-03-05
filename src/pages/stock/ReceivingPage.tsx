import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {getStockInbounds} from "@/api/stock";
import InboundDetailModal from "@/components/inbound/InboundDetailModal"; // 분리한 모달 컴포넌트
import type {StockInboundResponse} from "@/types";
import {requireStorePublicId} from "@/utils/store.ts";

export default function ReceivingPage() {
    const navigate = useNavigate();
    const storePublicId = requireStorePublicId();

    // --- States ---
    const [inbounds, setInbounds] = useState<StockInboundResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // 모달 제어 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInboundId, setSelectedInboundId] = useState<string | null>(null);

    // --- 데이터 로드 함수 ---
    const fetchList = async () => {
        if (!storePublicId) return;
        try {
            setLoading(true);
            const data = await getStockInbounds(storePublicId);

            const inboundList = Array.isArray(data) ? data : (data.content || []);

            setInbounds(inboundList);
        } catch (error) {
            console.error("입고 목록 로드 실패:", error);
            setInbounds([]); // 에러 시 빈 배열로 초기화하여 .map 에러 방지
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [storePublicId]);

    // --- 이벤트 핸들러 ---
    const handleRowClick = (publicId: string) => {
        setSelectedInboundId(publicId);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col gap-6 relative p-6 bg-gray-50 min-h-screen">
            {/* 상단 네비게이션 헤더 */}
            <div className="bg-[#1a1a1a] h-16 flex items-center justify-between px-6 shadow-md rounded-2xl text-white">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                            <i className="ph-fill ph-package text-[#1a1a1a] text-2xl"></i>
                        </div>
                        <h1 className="text-lg font-bold">입고<span className="text-gray-400">관리</span></h1>
                    </div>
                    <div className="flex gap-6 h-16 text-sm font-bold">
                        <button className="border-b-2 border-white px-1">입고 내역</button>
                        <button
                            onClick={() => navigate(`/stock/${storePublicId}/receiveRegister`)}
                            className="text-gray-400 hover:text-white transition-all"
                        >
                            입고 등록
                        </button>
                        <button className="text-gray-400 hover:text-white transition-all">증빙 보관함</button>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/stock/${storePublicId}/receiveRegister`)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
                >
                    <i className="ph ph-plus-circle text-lg"></i> 새 입고 등록
                </button>
            </div>

            {/* 메인 리스트 테이블 */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-400 uppercase">
                    <tr>
                        <th className="px-8 py-5">입고일자</th>
                        <th className="px-8 py-5">공급처</th>
                        <th className="px-8 py-5">대표 품목</th>
                        <th className="px-8 py-5 text-center">상태</th>
                        <th className="px-8 py-5 text-right">관리</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="py-24 text-center text-gray-400 animate-pulse font-bold">데이터 로드
                                중...
                            </td>
                        </tr>
                    ) : inbounds.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="py-24 text-center text-gray-400 font-bold">내역이 없습니다. 명세서를 스캔해
                                보세요.
                            </td>
                        </tr>
                    ) : (
                        inbounds.map((inbound) => (
                            <tr
                                key={inbound.inboundPublicId}
                                onClick={() => handleRowClick(inbound.inboundPublicId)}
                                className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                            >
                                <td className="px-8 py-5 text-gray-500 font-medium">
                                    {inbound.confirmedAt?.split('T')[0] || "검수 중"}
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800">{inbound.vendorName || "미지정"}</span>
                                        <span
                                            className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">
                                                ID: {inbound.inboundPublicId.split('-')[0]}
                                            </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-gray-500">
                                    {inbound.items.length > 0
                                        ? `${inbound.items[0].ingredientName} ${inbound.items.length > 1 ? `외 ${inbound.items.length - 1}건` : ''}`
                                        : "품목 없음"}
                                </td>
                                <td className="px-8 py-5 text-center">
                                        <span
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                inbound.status === 'CONFIRMED'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}>
                                            {inbound.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                                        </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button
                                        className="w-8 h-8 rounded-full bg-gray-50 text-gray-300 group-hover:bg-black group-hover:text-white transition-all inline-flex items-center justify-center">
                                        <i className="ph ph-caret-right text-lg"></i>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* --- 입고 상세 모달 연동 --- */}
            {storePublicId && (
                <InboundDetailModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    storePublicId={storePublicId}
                    inboundPublicId={selectedInboundId}
                    onConfirmSuccess={fetchList} // 확정 성공 시 리스트 리프레시
                />
            )}
        </div>
    );
}