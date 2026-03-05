import {useNavigate} from "react-router-dom";
import {useState, useEffect} from "react";
import {getDocuments} from "@/api/document";
import type {DocumentResponse} from "@/types";
import {requireStorePublicId} from "@/utils/store.ts";

export default function StockDocumentsPage() {
    const navigate = useNavigate();
    const storePublicId = requireStorePublicId();

    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // 미리보기 모달을 위한 상태
    const [previewFile, setPreviewFile] = useState<DocumentResponse | null>(null);

    // --- 데이터 로드 ---
    useEffect(() => {
        const fetchDocs = async () => {
            if (!storePublicId) return;
            try {
                setLoading(true);
                const data = await getDocuments(storePublicId);
                // API가 배열을 반환한다고 가정 (데이터가 단일 객체라면 [data]로 감싸야 함)
                setDocuments(Array.isArray(data) ? data : [data]);
            } catch (error) {
                console.error("문서 로드 실패:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, [storePublicId]);

    return (
        <div className="flex flex-col space-y-6 p-6">
            {/* 상단 블랙 네비게이션 헤더 */}
            <div className="bg-[#1a1a1a] h-16 flex items-center justify-between px-6 shadow-md rounded-2xl text-white">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                            <i className="ph-fill ph-package text-[#1a1a1a] text-2xl"></i>
                        </div>
                        <h1 className="text-lg font-bold">입고<span className="text-gray-400">관리</span></h1>
                    </div>
                    <nav className="flex gap-6 h-16 text-sm font-bold">
                        <button onClick={() => navigate(`/stock/${storePublicId}/receiving`)}
                                className="text-gray-400 hover:text-white transition-all">입고 내역
                        </button>
                        <button onClick={() => navigate(`/stock/${storePublicId}/receiveRegister`)}
                                className="text-gray-400 hover:text-white transition-all">입고 등록
                        </button>
                        <button className="border-b-2 border-white px-1">증빙 보관함</button>
                    </nav>
                </div>
            </div>

            {/* 메인 리스트 영역 */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-xl font-black text-gray-800">증빙 보관함</h2>
                        <p className="text-xs text-gray-400 mt-1 font-medium">OCR 스캔 시 자동 저장된 원본 파일을 관리합니다.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input type="text" placeholder="파일명 검색..."
                                   className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-black transition-all w-64"/>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead
                            className="bg-gray-50/50 text-gray-400 font-bold uppercase tracking-tighter border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-4">파일명 / 타입</th>
                            <th className="px-8 py-4">업로드 일시</th>
                            <th className="px-8 py-4 text-right">파일 관리</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={3}
                                    className="py-20 text-center text-gray-400 font-bold animate-pulse font-mono uppercase tracking-widest">Loading
                                    Documents...
                                </td>
                            </tr>
                        ) : documents.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-20 text-center text-gray-400 font-bold">저장된 증빙 서류가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc) => (
                                <tr key={doc.documentId} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            {/* 파일 확장자에 따른 아이콘 처리 */}
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                                                    doc.fileName.toLowerCase().endsWith('.pdf') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                                                }`}>
                                                <i className={doc.fileName.toLowerCase().endsWith('.pdf') ? 'ph-fill ph-file-pdf' : 'ph-fill ph-image'}></i>
                                            </div>
                                            <div className="flex flex-col">
                                                    <span
                                                        className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors cursor-pointer">
                                                        {doc.fileName}
                                                    </span>
                                                <span
                                                    className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-tighter">
                                                        ID: {doc.documentId}
                                                    </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-gray-500 font-medium">
                                        {new Date(doc.uploadedAt).toLocaleString('ko-KR')}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setPreviewFile(doc)}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-black hover:border-black transition-all shadow-sm"
                                                title="미리보기"
                                            >
                                                <i className="ph ph-eye text-lg"></i>
                                            </button>
                                            <a
                                                href={doc.presignedUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-black hover:border-black transition-all shadow-sm"
                                                title="다운로드"
                                            >
                                                <i className="ph ph-download-simple text-lg"></i>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 미리보기 모달 (Presigned URL 활용) --- */}
            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                         onClick={() => setPreviewFile(null)}></div>
                    <div
                        className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700 px-2 truncate">{previewFile.fileName}</h3>
                            <button onClick={() => setPreviewFile(null)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <i className="ph ph-x text-2xl"></i>
                            </button>
                        </div>
                        <div className="bg-gray-100 p-6 flex items-center justify-center h-[70vh] overflow-auto">
                            {previewFile.fileName.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={previewFile.presignedUrl}
                                        className="w-full h-full rounded-lg shadow-inner"/>
                            ) : (
                                <img src={previewFile.presignedUrl} alt="Preview"
                                     className="max-w-full max-h-full object-contain shadow-lg rounded-lg"/>
                            )}
                        </div>
                        <div className="p-4 bg-white border-t flex justify-end">
                            <button onClick={() => setPreviewFile(null)}
                                    className="px-6 py-2.5 bg-gray-100 font-bold text-gray-600 rounded-xl hover:bg-gray-200 transition-all">창
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}