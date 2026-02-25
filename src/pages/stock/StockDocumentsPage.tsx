import {useNavigate} from "react-router-dom";

export default function StockDocumentsPage() {
    const navigate = useNavigate();

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
                            onClick={() => navigate("/stock/receiving")}
                            className="flex items-center px-2 text-sm font-bold text-gray-400 hover:text-white transition-all"
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
                            className="flex items-center px-2 text-sm font-bold text-white border-b-2 border-white transition-all"
                        >
                            증빙 보관함
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-white text-xs font-medium">
          <span className="text-gray-500 uppercase tracking-tighter">
            Storage Usage
          </span>
                    <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="w-[45%] h-full bg-emerald-500"></div>
                    </div>
                    <span className="font-bold">45.2 GB / 100 GB</span>
                </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="space-y-6">
                {/* 페이지 헤더 */}
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">증빙 보관함</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            OCR 스캔 시 자동 저장된 원본 명세서 이미지 및 PDF 파일을 관리합니다.
                        </p>
                    </div>
                    <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                        <button className="p-2 bg-gray-100 rounded-lg text-black">
                            <i className="ph ph-squares-four text-lg"></i>
                        </button>
                        <button className="p-2 text-gray-400 hover:text-black transition-all">
                            <i className="ph ph-list text-lg"></i>
                        </button>
                    </div>
                </div>

                {/* 필터 섹션 */}
                <div
                    className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="파일 이름 또는 공급처 검색"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-black transition-all"
                            />
                        </div>
                        <select
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-black cursor-pointer">
                            <option>전체 파일</option>
                            <option>이미지 (JPG, PNG)</option>
                            <option>문서 (PDF)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">Sort by:</span>
                        <button className="text-xs font-bold text-gray-800 border-b border-black">
                            최신순
                        </button>
                    </div>
                </div>

                {/* 갤러리 그리드 */}
                <div className="grid grid-cols-4 gap-6">
                    {/* 파일 카드 1 */}
                    <div
                        className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all">
                        <div
                            className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden relative">
                            {/* 실제 구현 시 OCR 이미지 썸네일 */}
                            <div
                                className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-gray-300">
                                <i className="ph ph-file-jpg text-5xl mb-2"></i>
                                <span className="text-[10px] font-bold">
                  Image Preview
                  <br/>
                  Unavailable
                </span>
                            </div>
                            <div
                                className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <i className="ph ph-eye text-lg"></i>
                                </button>
                                <button
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <i className="ph ph-download-simple text-lg"></i>
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-bold text-gray-800 truncate">
                                240521_에이치식자재.jpg
                            </p>
                            <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                  2.4 MB
                </span>
                                <span className="text-[10px] text-emerald-500 font-black">
                  매칭 완료
                </span>
                            </div>
                        </div>
                    </div>

                    {/* 파일 카드 2 */}
                    <div
                        className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all">
                        <div
                            className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden relative">
                            <div
                                className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-gray-300">
                                <i className="ph ph-file-pdf text-5xl mb-2 text-red-400/50"></i>
                                <span className="text-[10px] font-bold text-red-400/50 uppercase">
                  Invoice_PDF
                </span>
                            </div>
                            <div
                                className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <i className="ph ph-eye text-lg"></i>
                                </button>
                                <button
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <i className="ph ph-download-simple text-lg"></i>
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-bold text-gray-800 truncate">
                                명세서_동국농산_0520.pdf
                            </p>
                            <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                  1.1 MB
                </span>
                                <span className="text-[10px] text-emerald-500 font-black">
                  매칭 완료
                </span>
                            </div>
                        </div>
                    </div>

                    {/* 파일 카드 3 (미매칭/미확정 상태) */}
                    <div
                        className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all ring-2 ring-amber-500/10">
                        <div
                            className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden relative">
                            <div
                                className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-gray-300">
                                <i className="ph ph-file-jpg text-5xl mb-2"></i>
                                <span className="text-[10px] font-bold uppercase">
                  Pending Scan
                </span>
                            </div>
                            <div
                                className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button
                                    onClick={() => navigate("/stock/receiving")}
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                >
                                    <i className="ph ph-scan text-lg"></i>
                                </button>
                            </div>
                        </div>
                        <div className="p-4 bg-amber-50/50">
                            <p className="text-xs font-bold text-gray-800 truncate">
                                SCAN_20240521_1302.jpg
                            </p>
                            <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                  3.8 MB
                </span>
                                <span className="text-[10px] text-amber-500 font-black">
                  데이터 확인 필요
                </span>
                            </div>
                        </div>
                    </div>

                    {/* 파일 카드 4 */}
                    <div
                        className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all">
                        <div
                            className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden relative">
                            <div
                                className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-gray-300">
                                <i className="ph ph-file-jpg text-5xl mb-2"></i>
                                <span className="text-[10px] font-bold">Image Preview</span>
                            </div>
                            <div
                                className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <i className="ph ph-eye text-lg"></i>
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-bold text-gray-800 truncate">
                                글로벌미트_삼겹살_0518.jpg
                            </p>
                            <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                  2.9 MB
                </span>
                                <span className="text-[10px] text-emerald-500 font-black">
                  매칭 완료
                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
