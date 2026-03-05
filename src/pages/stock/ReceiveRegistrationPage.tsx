import {analyzeReceipt} from "@/api/ocr";
import type {Item, ReceiptResponse, FieldStatus, Field} from "@/types";
import {useState, useRef} from "react";
import {useNavigate} from "react-router-dom";

// 화면 표시용으로 고유 id를 추가한 타입
interface DisplayReceiptItem extends Item {
    id: number;
}

export default function ReceiveRegistrationPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- States ---
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [items, setItems] = useState<DisplayReceiptItem[]>([]);

    // 기본 정보 상태 (입고 마스터 정보)
    const [basicInfo, setBasicInfo] = useState({
        vendorName: "",
        receiptDate: "",
        totalAmount: ""
    });

    // --- Actions ---
    const toggleOCRPanel = () => setIsPanelOpen(!isPanelOpen);

    const emptyField = (value: string | null = ""): Field<string> => ({
        value,
        status: "GREEN" as FieldStatus,
        message: null,
    });

    const emptyNumberField = (value: number | null = null): Field<number> => ({
        value,
        status: "GREEN" as FieldStatus,
        message: null,
    });

    const addNewRow = () => {
        setItems((prev) => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                ingredient: {
                    id: emptyNumberField(null),
                    name: emptyField(""),
                },
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

        // 💡 FileReader 대신 URL.createObjectURL 사용 (성능 및 안정성 향상)
        if (file.type.startsWith("image/")) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);

            // 메모리 누수 방지를 위한 클린업 로직 (선택사항)
            // 컴포넌트가 언마운트되거나 파일이 바뀔 때 URL.revokeObjectURL(objectUrl) 호출이 권장됩니다.
        } else if (file.type === "application/pdf") {
            // PDF일 경우 브라우저 내장 뷰어 활용 가능 (placeholder 대신)
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        } else {
            // 기타 문서 파일
            setPreviewUrl("https://placehold.co/400x600?text=Document+File");
        }
    };

    const processOCR = async () => {
        if (!selectedFile) return;

        try {
            setIsProcessing(true);
            const data: ReceiptResponse = await analyzeReceipt(selectedFile);

            // 1. 기본 정보 매핑 (Optional Chaining으로 안전하게)
            setBasicInfo({
                vendorName: data.vendor?.name?.value ?? "",
                receiptDate: data.date?.value ?? "",
                totalAmount: data.amount?.value ?? ""
            });

            // 2. 아이템 리스트 매핑 (null 안전성 확보)
            const newItems: DisplayReceiptItem[] = (data.items || []).map((item) => ({
                ...item,
                id: Date.now() + Math.random(),
                // 백엔드 value가 null이면 프론트에서 강조하기 위해 null 유지
                ingredient: {
                    ...item.ingredient,
                    id: {...item.ingredient.id, value: item.ingredient.id?.value ?? null},
                    name: {...item.ingredient.name, value: item.ingredient.name?.value ?? "미분류 품목"}
                }
            }));

            setItems(newItems);
            toggleOCRPanel();

            // 토스트 알림
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);

        } catch (error) {
            console.error("OCR 처리 실패:", error);
            alert("분석 중 오류가 발생했습니다. 파일을 다시 확인해주세요.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmStock = () => {
        if (items.length === 0) {
            alert("등록할 품목이 없습니다.");
            return;
        }

        const unmappedCount = items.filter(item => !item.ingredient.id.value).length;
        if (unmappedCount > 0) {
            alert(`매핑되지 않은 품목이 ${unmappedCount}개 있습니다. 재료를 선택해주세요.`);
            return;
        }

        // 실제 입고 확정 API 호출 로직이 들어갈 자리
        console.log("입고 확정 데이터:", {basicInfo, items});
        alert("입고 처리가 완료되었습니다.");
        navigate("/stock/receiving");
    };

    return (
        <div className="flex flex-col gap-6 relative min-h-screen bg-gray-50 p-6">
            {/* 상단 네비게이션 헤더 */}
            <div
                className="bg-[#1a1a1a] h-16 flex items-center justify-between px-6 shadow-md rounded-2xl z-30 text-white">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                            <i className="ph-fill ph-package text-[#1a1a1a] text-2xl"></i>
                        </div>
                        <h1 className="text-lg font-bold">입고<span className="text-gray-400">관리</span></h1>
                    </div>
                    <div className="flex gap-6 h-16 text-sm font-bold">
                        <button onClick={() => navigate("/stock/receiving")}
                                className="text-gray-400 hover:text-white">입고 내역
                        </button>
                        <button className="border-b-2 border-white px-1">입고 등록</button>
                        <button onClick={() => navigate("/stock/documents")}
                                className="text-gray-400 hover:text-white">증빙 보관함
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={toggleOCRPanel}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all border border-gray-700 shadow-sm">
                        <i className="ph ph-scan text-lg"></i> 명세서 스캔 (OCR)
                    </button>
                    <div className="w-px h-8 bg-gray-700 mx-1"></div>
                    <button onClick={handleConfirmStock}
                            className="flex items-center gap-2 px-8 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-md">
                        <i className="ph-fill ph-check-circle"></i> 입고 확정
                    </button>
                </div>
            </div>

            <div className="flex gap-6 items-start">
                {/* 메인 입력 구역 */}
                <div className="flex-1 flex flex-col gap-8">
                    {/* 1. 기본 정보 섹션 */}
                    <section className="w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <i className="ph ph-info text-black"></i> 입고 기본 정보
                            </h3>
                            {basicInfo.vendorName && (
                                <div
                                    className="text-[10px] font-bold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-300 shadow-sm flex items-center gap-1">
                                    <i className="ph-fill ph-magic-wand"></i> OCR 데이터 연동됨
                                </div>
                            )}
                        </div>
                        <div
                            className="grid grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div>
                                <label
                                    className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">공급처</label>
                                <input
                                    type="text"
                                    value={basicInfo.vendorName}
                                    onChange={(e) => setBasicInfo({...basicInfo, vendorName: e.target.value})}
                                    placeholder="공급처 이름 입력"
                                    className="w-full border-b border-gray-200 focus:border-black outline-none py-1 font-semibold text-gray-800 transition-colors"
                                />
                            </div>
                            <div>
                                <label
                                    className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">입고일자</label>
                                <input
                                    type="date"
                                    value={basicInfo.receiptDate}
                                    onChange={(e) => setBasicInfo({...basicInfo, receiptDate: e.target.value})}
                                    className="w-full border-b border-gray-200 focus:border-black outline-none py-1 font-semibold text-gray-800 transition-colors"
                                />
                            </div>
                            <div>
                                <label
                                    className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">총
                                    결제액</label>
                                <input
                                    type="text"
                                    value={basicInfo.totalAmount}
                                    onChange={(e) => setBasicInfo({...basicInfo, totalAmount: e.target.value})}
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
                            <button onClick={addNewRow}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition-all shadow-sm">
                                <i className="ph ph-plus-circle"></i> 품목 직접 추가
                            </button>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 w-12 text-center">상태</th>
                                    <th className="px-4 py-3">품목명</th>
                                    <th className="px-4 py-3 text-center">수량</th>
                                    <th className="px-4 py-3">규격</th>
                                    <th className="px-4 py-3 text-right">단가</th>
                                    <th className="px-4 py-3 text-right">합계</th>
                                    <th className="px-4 py-3 text-center">유통기한</th>
                                    <th className="px-4 py-3 text-center">삭제</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                    <tr className="text-center">
                                        <td colSpan={8} className="py-16 text-gray-400">
                                            <i className="ph ph-package text-4xl mb-2 block mx-auto"></i>
                                            스캔을 시작하거나 품목을 직접 추가하세요.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-4 py-4 text-center">
                                                <i className={`ph-fill ph-circle ${!item.ingredient.id.value ? "text-amber-500" : "text-emerald-500"}`}></i>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <input
                                                        type="text"
                                                        defaultValue={item.ingredient.name.value ?? ""}
                                                        className={`w-full bg-transparent border-b border-transparent focus:border-black outline-none font-bold ${!item.ingredient.id.value ? "text-amber-600" : "text-gray-800"}`}
                                                    />
                                                    {!item.ingredient.id.value && (
                                                        <span className="text-[9px] text-amber-500 font-medium mt-0.5">재료 매핑이 필요합니다.</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <input type="number" defaultValue={item.quantity.value ?? ""}
                                                       className="w-12 text-center border-b border-transparent focus:border-black outline-none font-bold"/>
                                            </td>
                                            <td className="px-4 py-4">
                                                <input type="text" defaultValue={item.rawCapacity.value ?? ""}
                                                       className="w-full bg-transparent border-b border-transparent focus:border-black outline-none text-gray-500"/>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <input type="text" defaultValue={item.costPrice.value ?? ""}
                                                       className="w-full bg-transparent border-b border-transparent focus:border-black outline-none text-right text-gray-600"/>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-gray-900">{item.totalPrice.value}</td>
                                            <td className="px-4 py-4 text-center">
                                                <input type="date" defaultValue={item.expirationDate.value ?? ""}
                                                       className="bg-gray-100 text-[10px] rounded px-1 py-0.5"/>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button onClick={() => removeRow(item.id)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors">
                                                    <i className="ph ph-trash text-lg"></i></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* 오른쪽 사이드바 (요약 현황) */}
                <div className="w-72 bg-white border border-gray-200 p-6 shadow-sm rounded-2xl sticky top-24 shrink-0">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">현재고 현황 요약</h4>
                    <div className="space-y-3">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400">대파 (kg)</p>
                            <div className="flex justify-between items-end">
                                <span className="text-xl font-black text-gray-800">2.5</span>
                                <span
                                    className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">정상</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400">식용유 (can)</p>
                            <div className="flex justify-between items-end">
                                <span className="text-xl font-black text-amber-600">0.5</span>
                                <span
                                    className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 rounded">부족</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- OCR 사이드 패널 --- */}
            <div
                className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.15)] z-[60] transform transition-transform duration-500 ease-in-out flex flex-col ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#1a1a1a] text-white">
                    <div className="flex items-center gap-2">
                        <i className="ph-fill ph-scan text-2xl"></i>
                        <h3 className="font-bold text-lg">명세서 분석 도구</h3>
                    </div>
                    <button onClick={toggleOCRPanel} className="hover:bg-white/10 p-2 rounded-full transition-all"><i
                        className="ph ph-x text-2xl"></i></button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* 업로드 구역 */}
                    <div
                        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center relative hover:border-black transition-colors group">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload}
                               accept="image/*,application/pdf"/>
                        <label onClick={() => fileInputRef.current?.click()} className="cursor-pointer block">
                            <div
                                className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <i className="ph ph-camera text-3xl text-black"></i>
                            </div>
                            <p className="font-bold text-black">명세서 파일 선택</p>
                            <p className="text-[11px] text-gray-400 mt-1">거래명세서 사진 또는 PDF를 업로드하세요</p>
                        </label>
                    </div>

                    {/* 미리보기 영역 수정 */}
                    {previewUrl && (
                        <div
                            className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-black min-h-[300px] flex items-center justify-center">
                            {selectedFile?.type === "application/pdf" ? (
                                <iframe
                                    src={`${previewUrl}#toolbar=0&navpanes=0`}
                                    className="w-full h-[500px] border-none"
                                />
                            ) : (
                                <img
                                    src={previewUrl}
                                    className={`w-full h-auto opacity-70 ${isProcessing ? 'blur-[1px]' : ''}`}
                                    alt="Preview"
                                />
                            )}

                            {isProcessing && (
                                <div
                                    className="absolute top-0 left-0 w-full h-1.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-scan z-10"></div>
                            )}
                        </div>
                    )}

                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                        <h4 className="text-[11px] font-bold text-blue-600 mb-2 uppercase flex items-center gap-1"><i
                            className="ph-fill ph-info"></i> 스캔 팁</h4>
                        <ul className="text-[11px] text-blue-700/80 space-y-1.5 leading-relaxed font-medium">
                            <li>• 글자가 뚜렷하게 보이도록 수평을 맞춰 촬영하세요.</li>
                            <li>• 여러 장일 경우 가장 선명한 페이지를 선택하세요.</li>
                            <li>• 분석 후 매핑되지 않은 품목은 직접 선택이 필요합니다.</li>
                        </ul>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                    <button onClick={toggleOCRPanel}
                            className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-all">취소
                    </button>
                    <button
                        onClick={processOCR}
                        disabled={!selectedFile || isProcessing}
                        className={`flex-[2] py-3 text-sm font-bold text-white rounded-xl transition-all shadow-md ${!selectedFile || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
                    >
                        {isProcessing ? "분석 중..." : "데이터 적용하기"}
                    </button>
                </div>
            </div>

            {/* 토스트 메시지 */}
            <div
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl transform transition-all duration-500 flex items-center gap-3 z-[70] ${showToast ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0"}`}>
                <i className="ph-fill ph-check-circle text-emerald-400 text-2xl"></i>
                <p className="font-bold">데이터 분석이 성공적으로 완료되었습니다.</p>
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 2.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}