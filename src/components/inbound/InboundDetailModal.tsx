import {useState, useEffect} from "react";
import {getStockInboundDetail, confirmInbound} from "@/api/stock";
import type {StockInboundResponse} from "@/types";

interface InboundDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    storePublicId: string;
    inboundPublicId: string | null;
    onConfirmSuccess: () => void; // 확정 성공 시 부모 목록을 새로고침하기 위한 콜백
}

export default function InboundDetailModal({
                                               isOpen,
                                               onClose,
                                               storePublicId,
                                               inboundPublicId,
                                               onConfirmSuccess
                                           }: InboundDetailModalProps) {
    const [inbound, setInbound] = useState<StockInboundResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    // 모달이 열리고 inboundPublicId가 있을 때만 상세 정보 페칭
    useEffect(() => {
        if (isOpen && inboundPublicId) {
            const fetchDetail = async () => {
                try {
                    setLoading(true);
                    const data = await getStockInboundDetail(storePublicId, inboundPublicId);
                    setInbound(data);
                } catch (error) {
                    console.error("상세 로드 실패:", error);
                    alert("상세 정보를 불러올 수 없습니다.");
                    onClose();
                } finally {
                    setLoading(false);
                }
            };
            fetchDetail();
        }
    }, [isOpen, inboundPublicId, storePublicId]);

    const handleConfirm = async () => {
        if (!inboundPublicId || !window.confirm("이 입고 내역을 확정하시겠습니까?")) return;

        try {
            setIsConfirming(true);
            await confirmInbound(storePublicId, inboundPublicId);
            alert("입고 확정이 완료되었습니다.");
            onConfirmSuccess(); // 부모의 리스트 갱신 함수 호출
            onClose(); // 모달 닫기
        } catch (error) {
            alert("확정 처리 중 오류가 발생했습니다.");
        } finally {
            setIsConfirming(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Body */}
            <div
                className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {loading ? (
                    <div className="p-20 text-center font-bold text-gray-400">
                        <div className="animate-spin mb-4 inline-block"><i className="ph ph-spinner text-3xl"></i></div>
                        <p>데이터를 불러오는 중...</p>
                    </div>
                ) : inbound && (
                    <>
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-black text-gray-800">입고 상세 내역</h3>
                                <p className="text-[10px] text-gray-400 mt-1 font-mono tracking-tighter uppercase">ID: {inbound.inboundPublicId}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <i className="ph ph-x text-2xl"></i>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8">
                            {/* 상단 정보 요약 */}
                            <div className="grid grid-cols-2 gap-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div className="space-y-1">
                                    <label
                                        className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">공급처명</label>
                                    <p className="text-lg font-bold text-gray-800">{inbound.vendorName || "미지정 공급처"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">처리
                                        상태</label>
                                    <p className={`text-sm font-bold flex items-center gap-1.5 ${inbound.status === 'CONFIRMED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        <i className={`ph-fill ${inbound.status === 'CONFIRMED' ? 'ph-check-circle' : 'ph-clock'}`}></i>
                                        {inbound.status === 'CONFIRMED' ? '입고 완료' : '검수 및 확정 대기'}
                                    </p>
                                </div>
                            </div>

                            {/* 품목 리스트 테이블 */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2">
                                    <i className="ph ph-shopping-cart"></i> 입고 품목 정보
                                </h4>
                                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-[11px]">
                                        <thead
                                            className="bg-gray-50 font-bold text-gray-400 border-b border-gray-100 uppercase tracking-tighter">
                                        <tr>
                                            <th className="px-5 py-3">품목명</th>
                                            <th className="px-2 py-3 text-center">수량</th>
                                            <th className="px-4 py-3 text-right">단가</th>
                                            <th className="px-4 py-3 text-right">합계</th>
                                            <th className="px-5 py-3 text-center">유통기한</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                        {inbound.items.map((item, idx) => {
                                            const isExpiredSoon = item.expirationDate && new Date(item.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 이내

                                            return (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-5 py-4">
                                                        <span
                                                            className="font-bold text-gray-700">{item.ingredientName}</span>
                                                    </td>
                                                    <td className="px-2 py-4 text-center font-black text-gray-800">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-gray-400">
                                                        ₩{item.unitPrice?.toLocaleString() || 0}
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-bold text-gray-900">
                                                        ₩{(item.quantity * item.unitPrice).toLocaleString()}
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        {item.expirationDate ? (
                                                            <span
                                                                className={`px-2 py-1 rounded font-mono text-[10px] font-bold ${
                                                                    isExpiredSoon ? 'bg-red-50 text-red-500 ring-1 ring-red-100' : 'bg-gray-100 text-gray-500'
                                                                }`}>
                  {item.expirationDate.split('T')[0]}
                </span>
                                                        ) : (
                                                            <span className="text-gray-300 italic">미입력</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                        <tfoot className="bg-gray-50/80 border-t-2 border-gray-100">
                                        <tr>
                                            <td colSpan={3}
                                                className="px-5 py-4 text-right font-bold text-gray-400 uppercase">Total
                                                Amount
                                            </td>
                                            <td colSpan={2}
                                                className="px-5 py-4 text-right font-black text-emerald-600 text-sm">
                                                ₩{inbound.items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0).toLocaleString()}
                                            </td>
                                        </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* 하단 버튼 구역 */}
                        <div className="p-6 border-t bg-gray-50 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 font-bold text-gray-500 hover:bg-gray-200 rounded-2xl transition-all"
                            >
                                닫기
                            </button>
                            {inbound.status === 'DRAFT' && (
                                <button
                                    onClick={handleConfirm}
                                    disabled={isConfirming}
                                    className="flex-[2] py-3.5 font-bold text-white bg-black hover:bg-gray-800 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:bg-gray-300"
                                >
                                    <i className="ph ph-check-square-offset"></i>
                                    {isConfirming ? "확정 처리 중..." : "최종 입고 확정"}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}