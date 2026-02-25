import {analyzeReceipt} from "@/api/ocr";
import type {ReceiptItem, ReceiptResponse, FieldStatus, Field} from "@/types";
import {useState} from "react";
import {useNavigate} from "react-router-dom";

// 화면 표시용으로 id를 추가한 타입
interface DisplayReceiptItem extends ReceiptItem {
    id: number;
}

export default function ReceiveRegistrationPage() {
    const navigate = useNavigate();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const toggleOCRPanel = () => {
        setIsPanelOpen(!isPanelOpen);
    };

    const handleConfirmStock = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const [items, setItems] = useState<DisplayReceiptItem[]>([]);

    const emptyField = (value: string | null = ""): Field<string> => ({
        value,
        status: "GREEN" as FieldStatus,
        message: null,
    });


    const addNewRow = () => {
        setItems((prev) => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                name: emptyField(""),
                quantity: emptyField("0"),
                rawCapacity: emptyField(""),
                costPrice: emptyField("0"),
                totalPrice: emptyField("0"),
                expirationDate: emptyField(""),
            },
        ]);
    };

    const removeRow = (id: number) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.getElementById("ocrPreviewImg") as HTMLImageElement;
            if (img && e.target?.result) {
                img.src = e.target.result as string;
                document.getElementById("ocrPreviewContainer")?.classList.remove("hidden");
                const scanLine = document.getElementById("scanLine");
                if (scanLine) {
                    scanLine.classList.remove("hidden");
                    scanLine.style.animation = "scan 2s linear infinite";
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const processOCR = async () => {
        if (!selectedFile) return;

        try {
            setIsProcessing(true);

            const data: ReceiptResponse = await analyzeReceipt(selectedFile);

            (document.getElementById("vendorName") as HTMLInputElement).value =
                data.vendorName.value ?? "";

            (document.getElementById("receiptDate") as HTMLInputElement).value =
                data.date.value ?? "";

            (document.getElementById("totalAmount") as HTMLInputElement).value =
                data.amount.value ?? "";

            document.getElementById("aiStatus")?.classList.remove("hidden");

            const newItems: DisplayReceiptItem[] = data.items.map((item) => ({
                id: Date.now() + Math.random(),
                name: item.name,
                quantity: item.quantity,
                rawCapacity: item.rawCapacity,
                costPrice: item.costPrice,
                totalPrice: item.totalPrice,
                expirationDate: item.expirationDate,
            }));

            setItems(newItems);

            toggleOCRPanel();
            handleConfirmStock();

        } catch (error) {
            console.error("OCR 처리 실패:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 relative">
            {/* 페이지 헤더 (Black Theme) */}
            <div className="bg-[#1a1a1a] h-16 flex items-center justify-between px-6 shadow-md rounded-xl z-30">
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
                            onClick={() => navigate("/stock/receiving")}
                            className="flex items-center px-2 text-sm font-bold text-gray-400 hover:text-white transition-all"
                        >
                            입고 내역
                        </button>
                        <button
                            className="flex items-center px-2 text-sm font-bold text-white border-b-2 border-white transition-all"
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
                    <button
                        onClick={toggleOCRPanel}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-all border border-gray-700 shadow-sm cursor-pointer"
                    >
                        <i className="ph ph-scan text-lg"></i> 명세서 스캔 (OCR)
                    </button>
                    <div className="w-px h-8 bg-gray-700 mx-1"></div>
                    <button
                        onClick={handleConfirmStock}
                        className="flex items-center gap-2 px-8 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-md cursor-pointer"
                    >
                        <i className="ph-fill ph-check-circle"></i> 입고 확정
                    </button>
                </div>
            </div>

            {/* 메인 콘텐츠 구역 */}
            <div className="flex gap-6 items-start">
                {/* 왼쪽: 입력 폼 구역 */}
                <div className="flex-1 flex flex-col gap-8">
                    {/* 1. 기본 정보 섹션 */}
                    <section className="w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <i className="ph ph-info text-black"></i> 입고 기본 정보
                            </h3>
                            <div
                                id="aiStatus"
                                className="hidden text-[10px] font-bold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-300 items-center gap-1 shadow-sm"
                            >
                                <i className="ph-fill ph-magic-wand"></i> OCR 데이터 연동됨
                            </div>
                        </div>
                        <div
                            className="grid grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div>
                                <label
                                    className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                                    공급처
                                </label>
                                <input
                                    type="text"
                                    id="vendorName"
                                    placeholder="공급처 이름 입력"
                                    className="w-full border-b border-gray-200 focus:border-black outline-none py-1 font-semibold text-gray-800 transition-colors"
                                />
                            </div>
                            <div>
                                <label
                                    className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                                    입고일자
                                </label>
                                <input
                                    type="date"
                                    id="receiptDate"
                                    className="w-full border-b border-gray-200 focus:border-black outline-none py-1 font-semibold text-gray-800 transition-colors"
                                />
                            </div>
                            <div>
                                <label
                                    className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                                    총 결제액
                                </label>
                                <input
                                    type="text"
                                    id="totalAmount"
                                    placeholder="0"
                                    className="w-full border-b border-gray-200 focus:border-black outline-none py-1 font-semibold text-gray-800 text-right transition-colors"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 2. 품목 리스트 섹션 */}
                    <section className="w-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <i className="ph ph-list-bullets text-black"></i> 입고 품목 리스트
                            </h3>
                            <button
                                onClick={addNewRow}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition-all shadow-sm cursor-pointer"
                            >
                                <i className="ph ph-plus-circle"></i> 품목 직접 추가
                            </button>
                        </div>

                        <div
                            className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-gray-500 w-12 text-center">
                                            상태
                                        </th>
                                        <th className="px-4 py-3 font-bold text-gray-500">품목명</th>
                                        <th className="px-4 py-3 font-bold text-gray-500 text-center">
                                            수량
                                        </th>
                                        <th className="px-4 py-3 font-bold text-gray-500">규격</th>
                                        <th className="px-4 py-3 font-bold text-gray-500 text-right">
                                            단가
                                        </th>
                                        <th className="px-4 py-3 font-bold text-gray-500 text-right">
                                            합계
                                        </th>
                                        <th className="px-4 py-3 font-bold text-gray-500 text-center">
                                            유통기한
                                        </th>
                                        <th className="px-4 py-3 font-bold text-gray-500 text-center">
                                            삭제
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody id="itemTable" className="divide-y divide-gray-100">
                                    {items.length === 0 ? (
                                        <tr id="emptyRow" className="text-center py-20">
                                            <td colSpan={8} className="py-12 text-gray-400">
                                                <i className="ph ph-package text-4xl mb-2 block mx-auto"></i>
                                                명세서를 스캔하거나 '직접 추가'를 눌러 품목을 등록하세요.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50 transition-colors group"
                                            >
                                                <td className="px-4 py-4 text-center">
                                                    <i
                                                        className={`ph-fill ph-circle ${
                                                            item.name.status === "GREEN" || !item.name.status
                                                                ? "text-emerald-500"
                                                                : "text-amber-500"
                                                        }`}
                                                    ></i>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="text"
                                                        defaultValue={item.name.value ?? ""}
                                                        placeholder="품목명 입력"
                                                        className={`w-full bg-transparent border-b border-transparent focus:border-black outline-none font-bold text-gray-800 ${
                                                            item.name.status === "YELLOW" ? "bg-amber-50" : ""
                                                        }`}
                                                    />
                                                    {item.name.message && (
                                                        <p className="text-[9px] text-amber-600 mt-0.5">
                                                            {item.name.message}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        defaultValue={item.quantity.value ?? ""}
                                                        placeholder="0"
                                                        className="w-12 text-center border-b border-transparent focus:border-black outline-none font-bold"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="text"
                                                        defaultValue={item.rawCapacity.value ?? ""}
                                                        placeholder="단위"
                                                        className="w-full bg-transparent border-b border-transparent focus:border-black outline-none text-gray-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <input
                                                        type="text"
                                                        defaultValue={item.costPrice.value ?? ""}
                                                        placeholder="0"
                                                        className="w-full bg-transparent border-b border-transparent focus:border-black outline-none text-right text-gray-600"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold text-gray-900">
                                                    {item.totalPrice.value}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <input
                                                        type="date"
                                                        defaultValue={item.expirationDate.value ?? ""}
                                                        className="bg-gray-100 text-[10px] rounded px-1 py-0.5 border-none outline-none"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => removeRow(item.id)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                                    >
                                                        <i className="ph ph-trash text-lg"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>

                {/* 오른쪽 사이드바: 현재고 현황 요약 */}
                <div
                    className="w-72 bg-white border border-gray-200 p-6 no-print shadow-sm rounded-2xl sticky top-24 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            현재고 현황
                        </h4>
                        <i className="ph ph-arrows-clockwise text-gray-400 cursor-pointer hover:rotate-180 transition-transform"></i>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400">대파 (kg)</p>
                            <div className="flex justify-between items-end">
                                <span className="text-xl font-black text-gray-800">2.5</span>
                                <span
                                    className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded mb-1">
                  정상
                </span>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400">식용유 (can)</p>
                            <div className="flex justify-between items-end">
                                <span className="text-xl font-black text-amber-600">0.5</span>
                                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 rounded mb-1">
                  부족
                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 우측 슬라이드 OCR 패널 (Black Style) */}
            <div
                id="ocrPanel"
                className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-[60] transform transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${
                    isPanelOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#1a1a1a] text-white">
                    <div className="flex items-center gap-2">
                        <i className="ph ph-scan text-2xl"></i>
                        <h3 className="font-bold text-lg">명세서 분석 도구</h3>
                    </div>
                    <button
                        onClick={toggleOCRPanel}
                        className="hover:bg-white/10 p-2 rounded-full transition-all cursor-pointer"
                    >
                        <i className="ph ph-x text-2xl"></i>
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    <div
                        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center relative group">
                        <input
                            type="file"
                            id="ocrInput"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <label htmlFor="ocrInput" className="cursor-pointer block">
                            <div
                                className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <i className="ph ph-camera text-3xl text-black"></i>
                            </div>
                            <p className="font-bold text-black">이미지 업로드</p>
                            <p className="text-xs text-gray-400 mt-1">
                                거래명세서 사진을 선택하거나 드래그하세요
                            </p>
                        </label>
                    </div>

                    <div id="ocrPreviewContainer" className="hidden space-y-4">
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                            <img
                                id="ocrPreviewImg"
                                className="w-full h-auto"
                                src=""
                                alt="Preview"
                            />
                            <div
                                id="scanLine"
                                className="absolute top-0 left-0 w-full h-1 bg-black shadow-[0_0_15px_rgba(0,0,0,0.8)] hidden"
                            ></div>
                        </div>
                        {isProcessing && (
                            <div className="bg-gray-900 p-4 rounded-xl text-center">
                                <p className="text-sm font-bold text-white animate-pulse">
                                    데이터 추출 중...
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase flex items-center gap-1">
                            <i className="ph ph-info"></i> 도움말
                        </h4>
                        <ul className="text-xs text-gray-500 space-y-2 leading-relaxed">
                            <li>• 사진이 흔들리지 않게 밝은 곳에서 촬영하세요.</li>
                            <li>• 품목명, 수량, 단가가 잘 보이도록 찍어주세요.</li>
                            <li>• 스캔 후 데이터는 왼쪽 표에서 수정 가능합니다.</li>
                        </ul>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                    <button
                        onClick={toggleOCRPanel}
                        className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
                    >
                        취소
                    </button>
                    <button
                        onClick={processOCR}
                        id="processBtn"
                        className="flex-[2] py-3 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                        데이터 적용하기
                    </button>
                </div>
            </div>

            {/* Toast */}
            <div
                id="toast"
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl transform transition-all duration-500 flex items-center gap-3 z-[70] ${
                    showToast ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0"
                }`}
            >
                <i className="ph-fill ph-check-circle text-emerald-400 text-2xl"></i>
                <p className="font-bold">재고 정보가 성공적으로 반영되었습니다.</p>
            </div>

            <style>{`
        @keyframes scan {
            0% { top: 0; }
            50% { top: 100%; }
            100% { top: 0; }
        }
      `}</style>
        </div>
    );
}
