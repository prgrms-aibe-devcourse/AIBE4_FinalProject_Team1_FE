import {useState, useEffect} from "react";
import {getDocuments} from "@/api/ocr/document.ts";
import type {DocumentResponse} from "@/types";
import {requireStorePublicId} from "@/utils/store.ts";

function formatDateTime(dateStr?: string | null) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function StockDocumentsPage() {
    const storePublicId = requireStorePublicId();

    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<DocumentResponse | null>(null);

    useEffect(() => {
        const fetchDocs = async () => {
            if (!storePublicId) return;
            try {
                setLoading(true);
                const data = await getDocuments(storePublicId);
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="mx-auto w-full max-w-6xl px-6 py-8 flex flex-col flex-1">

                {/* [상단 헤더] StockLogPage와 동일한 스타일 */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">증빙 보관함</h1>
                        <p className="mt-3 text-sm text-gray-500">
                            OCR 스캔 시 자동 저장된 원본 증빙 서류를 관리하고 확인하세요.
                        </p>
                    </div>
                </div>

                {/* [리스트 영역] StockLogPage의 테이블 컨테이너 스타일 적용 */}
                <div
                    className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-gray-400 font-black uppercase tracking-wider">
                                <th className="px-6 py-4 w-16 text-center">유형</th>
                                <th className="px-6 py-4">파일명 및 문서 정보</th>
                                <th className="px-6 py-4 w-40">업로드 일시</th>
                                <th className="px-6 py-4 w-32 text-right">관리</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-gray-400 font-bold animate-pulse">
                                        저장소 동기화 중...
                                    </td>
                                </tr>
                            ) : documents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-gray-400 font-bold">
                                        저장된 증빙 서류가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => {
                                    const fileName = doc.fileName.toLowerCase();

                                    // 1. 파일 확장자별 스타일/아이콘 설정
                                    const fileConfig = fileName.endsWith('.pdf')
                                        ? {
                                            bg: 'border-red-50 bg-red-50 text-red-500',
                                            icon: 'ph-file-pdf',
                                            label: 'PDF'
                                        }
                                        : fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
                                            ? {
                                                bg: 'border-green-50 bg-green-50 text-green-600',
                                                icon: 'ph-file-xls',
                                                label: 'EXCEL'
                                            }
                                            : {
                                                bg: 'border-blue-50 bg-blue-50 text-blue-500',
                                                icon: 'ph-image',
                                                label: 'IMAGE'
                                            };

                                    return (
                                        <tr key={doc.documentId} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 text-center">
                                                {/* 아이콘 박스 영역 */}
                                                <div
                                                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-colors ${fileConfig.bg}`}>
                                                    <i className={`ph-fill ${fileConfig.icon} text-xl`}></i>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                <span
                                                    className="font-black text-gray-900 text-sm group-hover:text-blue-600 transition-colors cursor-pointer"
                                                    onClick={() => setPreviewFile(doc)}
                                                >
                                                    {doc.fileName}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {/* 확장자 배지: StockLogPage의 타입 배지와 동일한 스타일 */}
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded text-[9px] font-black border uppercase ${fileConfig.bg} border-transparent`}>
                                                                {fileConfig.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 font-medium whitespace-nowrap">
                                                {formatDateTime(doc.uploadedAt)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setPreviewFile(doc)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:border-black hover:text-black transition-all shadow-sm"
                                                        title="미리보기"
                                                    >
                                                        <i className="ph ph-eye text-lg"></i>
                                                    </button>
                                                    <a
                                                        href={doc.presignedUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-black transition-all shadow-md"
                                                        title="다운로드"
                                                    >
                                                        <i className="ph ph-download-simple text-lg"></i>
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                    {/* 하단 요약 바 */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Total {documents.length.toLocaleString()} Archived Documents
                        </span>
                    </div>
                </div>
            </div>

            {/* --- 미리보기 모달 (StockLogPage의 톤앤매너 유지) --- */}
            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                         onClick={() => setPreviewFile(null)}></div>
                    <div
                        className="relative max-w-5xl w-full bg-white shadow-2xl flex flex-col animate-in zoom-in duration-200 rounded-3xl overflow-hidden border border-gray-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Viewer</span>
                                <h3 className="font-black text-gray-900 truncate">{previewFile.fileName}</h3>
                            </div>
                            <button onClick={() => setPreviewFile(null)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                                <i className="ph ph-x text-2xl text-gray-400"></i>
                            </button>
                        </div>
                        <div className="bg-gray-50 flex items-center justify-center h-[70vh] overflow-hidden">
                            {previewFile.fileName.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={previewFile.presignedUrl} className="w-full h-full border-none"/>
                            ) : (
                                <img src={previewFile.presignedUrl} alt="Preview"
                                     className="max-w-full max-h-full object-contain p-4"/>
                            )}
                        </div>
                        <div className="p-5 bg-white border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="px-8 py-3 bg-black font-black text-[11px] uppercase tracking-widest text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                            >
                                Close Viewer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}