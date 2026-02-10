import {useState, useMemo, useRef} from "react";
import ReceiptUploader from "./ReceiptUploader";
import TransactionForm, {type TransactionFormData} from "../form/TransactionForm";
import {analyzeReceipt, type OcrResultItem} from "../../services/ocrService";
import Loading from "../loading/Loading";
import axios from "axios";

type ReceiptScanModalProps = {
    onClose: () => void;
};

export default function ReceiptScanModal({onClose}: ReceiptScanModalProps) {
    const [files, setFiles] = useState<File[]>([]);

    // 여러 장의 분석 결과를 저장하는 상태
    const [ocrResults, setOcrResults] = useState<OcrResultItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 저장이 완료된 영수증 인덱스 목록
    const [completedIndices, setCompletedIndices] = useState<number[]>([]);

    // 다중 선택된 인덱스 목록
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // 현재 보여줄 폼 데이터
    const [currentFormData, setCurrentFormData] = useState<Partial<TransactionFormData> | undefined>(undefined);

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 분석 취소를 위한 AbortController Ref
    const abortControllerRef = useRef<AbortController | null>(null);

    // 분석 실패한 인덱스 계산
    const failedIndices = useMemo(() => {
        return ocrResults.reduce((acc, item, index) => {
            const amount = parseInt(item.amount.replace(/,/g, ''), 10) || 0;
            // 실패 조건: 상점명이 Error, 날짜가 없음, 금액이 0
            if (item.storeName === 'Error' || !item.date || amount === 0) {
                acc.push(index);
            }
            return acc;
        }, [] as number[]);
    }, [ocrResults]);

    const handleFilesChange = (newFiles: File[]) => {
        setFiles(newFiles);
        // 파일이 변경되면 결과 초기화 (새로 분석 필요)
        if (newFiles.length !== files.length) {
            // 파일 개수가 달라지면 초기화하는 것이 안전하지만,
            // 단순히 추가된 경우라면 기존 결과를 유지할 수도 있음.
            // 여기서는 단순화를 위해 파일 목록이 바뀌면 분석 전 상태로 간주하거나,
            // 분석 결과가 있다면 유지하되 인덱스 처리에 주의해야 함.
            // 일단 파일이 바뀌면 분석 결과는 초기화하지 않지만,
            // 사용자가 '분석 요청'을 다시 눌러야 갱신됨을 인지해야 함.
        }
    };

    // OCR 결과를 폼 데이터로 변환하는 헬퍼 함수
    const mapOcrItemToFormData = (item: OcrResultItem): Partial<TransactionFormData> => {
        let method: 'card' | 'cash' | 'bank' = 'card';
        if (item.paymentMethod?.includes('현금')) method = 'cash';
        else if (item.paymentMethod?.includes('은행') || item.paymentMethod?.includes('계좌')) method = 'bank';

        return {
            amount: parseInt(item.amount.replace(/,/g, ''), 10) || 0,
            date: item.date,
            payee: item.storeName === 'Error' ? '' : item.storeName, // Error면 빈 값으로 표시
            memo: '',
            category: item.category || '기타지출',
            type: 'expense',
            method: method,
            tags: []
        };
    };

    const handleIndexChange = (index: number) => {
        setCurrentIndex(index);

        // 분석 결과가 있고 해당 인덱스의 결과가 존재하면 폼 데이터 업데이트
        if (ocrResults.length > 0 && ocrResults[index]) {
            setCurrentFormData(mapOcrItemToFormData(ocrResults[index]));
        } else {
            // 분석 전이거나 결과가 없으면 폼 초기화
            setCurrentFormData(undefined);
        }
    };

    const handleRemoveFile = (indexToRemove: number) => {
        // 1. OCR 결과 제거
        const updatedOcrResults = ocrResults.filter((_, index) => index !== indexToRemove);
        setOcrResults(updatedOcrResults);

        // 2. 완료 목록 업데이트 (삭제된 인덱스 제거 및 인덱스 조정)
        const updatedCompletedIndices = completedIndices
            .filter(idx => idx !== indexToRemove) // 삭제된 인덱스 제거
            .map(idx => (idx > indexToRemove ? idx - 1 : idx)); // 뒤쪽 인덱스 당기기
        setCompletedIndices(updatedCompletedIndices);

        // 3. 선택 목록 업데이트
        const updatedSelectedIndices = selectedIndices
            .filter(idx => idx !== indexToRemove)
            .map(idx => (idx > indexToRemove ? idx - 1 : idx));
        setSelectedIndices(updatedSelectedIndices);

        // 4. 현재 인덱스 및 폼 데이터 갱신
        let nextIndex = currentIndex;
        if (updatedOcrResults.length === 0) {
            nextIndex = 0;
            setCurrentFormData(undefined);
        } else {
            if (currentIndex >= updatedOcrResults.length) {
                nextIndex = updatedOcrResults.length - 1;
            } else if (indexToRemove < currentIndex) {
                nextIndex = currentIndex - 1;
            }
            // 같은 인덱스라도 데이터가 당겨졌으므로 갱신 필요
            setCurrentFormData(mapOcrItemToFormData(updatedOcrResults[nextIndex]));
        }
        setCurrentIndex(nextIndex);
    };

    const handleUndoComplete = (index: number) => {
        setCompletedIndices(prev => prev.filter(i => i !== index));
        handleIndexChange(index); // 해당 인덱스로 이동하여 수정 가능하게 함
    };

    const handleToggleSelection = (index: number) => {
        setSelectedIndices(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleAnalyze = async () => {
        if (files.length === 0) {
            alert("영수증 파일을 1개 이상 선택해주세요.");
            return;
        }

        setIsAnalyzing(true);

        // AbortController 생성
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await analyzeReceipt(files, controller.signal);

            if (!response.results || response.results.length === 0) {
                alert("분석된 결과가 없습니다.");
                return;
            }

            // 전체 결과 저장 및 첫 번째 결과 표시
            setOcrResults(response.results);
            setCurrentIndex(0);
            setCompletedIndices([]); // 재분석 시 완료 목록 초기화
            setSelectedIndices([]);
            setCurrentFormData(mapOcrItemToFormData(response.results[0]));

            alert(`총 ${response.results.length}장의 영수증이 분석되었습니다.\n내용을 확인하고 저장해주세요.`);
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log("OCR analysis canceled");
            } else {
                console.error("OCR analysis failed:", error);
                alert("영수증 분석에 실패했습니다. 다시 시도해주세요.");
            }
        } finally {
            setIsAnalyzing(false);
            abortControllerRef.current = null;
        }
    };

    const handleRetryFailed = async () => {
        if (failedIndices.length === 0) return;
        await retryIndices(failedIndices);
    };

    const handleBulkRetry = async () => {
        if (selectedIndices.length === 0) return;
        await retryIndices(selectedIndices);
    };

    const retryIndices = async (indicesToRetry: number[]) => {
        setIsAnalyzing(true);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            // 재분석할 파일들 추출
            const filesToRetry = indicesToRetry.map(index => files[index]);

            const response = await analyzeReceipt(filesToRetry, controller.signal);

            if (!response.results || response.results.length === 0) {
                alert("재분석 결과가 없습니다.");
                return;
            }

            // 기존 결과 업데이트
            const newOcrResults = [...ocrResults];
            response.results.forEach((result, i) => {
                const originalIndex = indicesToRetry[i];
                if (originalIndex !== undefined) {
                    newOcrResults[originalIndex] = result;
                }
            });

            setOcrResults(newOcrResults);

            // 현재 보고 있는 항목이 재분석 대상이었다면 폼 데이터 갱신
            if (indicesToRetry.includes(currentIndex)) {
                setCurrentFormData(mapOcrItemToFormData(newOcrResults[currentIndex]));
            }

            // 재분석된 항목들은 완료 목록에서 제거 (다시 확인 필요하므로)
            setCompletedIndices(prev => prev.filter(idx => !indicesToRetry.includes(idx)));

            alert("재분석이 완료되었습니다.");

        } catch (error) {
            if (axios.isCancel(error)) {
                console.log("Retry canceled");
            } else {
                console.error("Retry failed:", error);
                alert("재분석에 실패했습니다.");
            }
        } finally {
            setIsAnalyzing(false);
            abortControllerRef.current = null;
        }
    };

    const handleBulkDelete = () => {
        if (selectedIndices.length === 0) return;
        if (!confirm(`선택한 ${selectedIndices.length}개의 항목을 삭제하시겠습니까?`)) return;

        // 인덱스가 큰 것부터 삭제해야 앞쪽 인덱스가 밀리지 않음
        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);

        // 파일 목록 업데이트 (ReceiptUploader 내부 상태는 onFilesChange로 동기화됨)
        const newFiles = files.filter((_, index) => !selectedIndices.includes(index));
        setFiles(newFiles);

        // OCR 결과 업데이트
        const newOcrResults = ocrResults.filter((_, index) => !selectedIndices.includes(index));
        setOcrResults(newOcrResults);

        // 완료 목록 재계산
        // 삭제된 인덱스보다 뒤에 있던 인덱스들은 당겨져야 함
        let newCompletedIndices = [...completedIndices];
        sortedIndices.forEach(deletedIdx => {
            newCompletedIndices = newCompletedIndices
                .filter(idx => idx !== deletedIdx)
                .map(idx => idx > deletedIdx ? idx - 1 : idx);
        });
        setCompletedIndices(newCompletedIndices);

        // 선택 목록 초기화
        setSelectedIndices([]);

        // 현재 인덱스 조정
        if (newFiles.length === 0) {
            setCurrentIndex(0);
            setCurrentFormData(undefined);
        } else {
            // 현재 인덱스가 삭제되었거나 범위를 벗어나면 조정
            let newIndex = currentIndex;
            // 현재 인덱스보다 앞에 삭제된 개수만큼 감소
            const deletedBeforeCurrent = selectedIndices.filter(idx => idx < currentIndex).length;
            newIndex -= deletedBeforeCurrent;

            if (selectedIndices.includes(currentIndex)) {
                // 현재 보고 있던 항목이 삭제된 경우, 그 다음 항목(또는 마지막)을 보여줌
                // 위에서 이미 감소되었으므로 범위만 체크하면 됨
            }

            if (newIndex >= newFiles.length) newIndex = newFiles.length - 1;
            if (newIndex < 0) newIndex = 0;

            setCurrentIndex(newIndex);
            if (newOcrResults.length > 0) {
                setCurrentFormData(mapOcrItemToFormData(newOcrResults[newIndex]));
            } else {
                setCurrentFormData(undefined);
            }
        }
    };

    const handleBulkSave = () => {
        if (selectedIndices.length === 0) return;

        // 선택된 항목 중 아직 완료되지 않은 항목만 저장 처리
        const indicesToSave = selectedIndices.filter(idx => !completedIndices.includes(idx));

        if (indicesToSave.length === 0) {
            alert("선택한 항목들은 이미 저장되었습니다.");
            return;
        }

        // TODO: 실제 API로 일괄 저장 요청
        console.log("Bulk saving indices:", indicesToSave);
        indicesToSave.forEach(idx => {
            console.log(`Saving item ${idx}:`, ocrResults[idx]);
        });

        setCompletedIndices(prev => [...prev, ...indicesToSave]);
        setSelectedIndices([]); // 선택 해제
        alert(`${indicesToSave.length}개의 항목이 저장되었습니다.`);
    };

    const handleCancelAnalyze = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const handleFormSubmit = (data: TransactionFormData) => {
        console.log(`Submitting transaction ${currentIndex + 1}/${ocrResults.length}:`, data);

        // TODO: 실제 데이터 저장 API 호출 (여기서 개별 건 저장)

        // 현재 인덱스를 완료 목록에 추가
        setCompletedIndices(prev => [...prev, currentIndex]);

        // 다음 영수증이 있는지 확인
        if (currentIndex < ocrResults.length - 1) {
            const nextIndex = currentIndex + 1;
            handleIndexChange(nextIndex); // 인덱스 변경 및 폼 데이터 갱신
        } else {
            // 모든 영수증을 다 확인했는지 체크
            if (completedIndices.length + 1 >= ocrResults.length) {
                alert("모든 영수증이 저장되었습니다!");
                onClose();
            } else {
                alert("저장되었습니다. 아직 저장하지 않은 영수증이 남아있습니다.");
            }
        }
    };

    const handleSkip = () => {
        if (currentIndex < ocrResults.length - 1) {
            const nextIndex = currentIndex + 1;
            handleIndexChange(nextIndex);
        } else {
            alert("마지막 영수증입니다.");
        }
    };

    const handleClose = () => {
        if (isAnalyzing) return;
        onClose();
    };

    return (
        <div
            className="fixed inset-0 flex justify-center items-center z-50 p-4"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl relative min-h-[400px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 로딩 오버레이 */}
                {isAnalyzing && (
                    <div
                        className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4">
                        <Loading/>
                        <button
                            onClick={handleCancelAnalyze}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-full text-slate-600 text-sm font-semibold hover:bg-slate-50 shadow-sm transition-colors"
                        >
                            분석 취소
                        </button>
                    </div>
                )}

                {/* Modal Header */}
                <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">영수증 스캔으로 기록하기</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isAnalyzing}
                        className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-h-[80vh] overflow-y-auto">
                    {/* Left: Uploader */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">1. 영수증 업로드</h3>
                        <ReceiptUploader
                            files={files}
                            onFilesChange={handleFilesChange}
                            currentIndex={currentIndex}
                            onIndexChange={handleIndexChange}
                            completedIndices={completedIndices}
                            failedIndices={failedIndices}
                            onRemoveFile={handleRemoveFile}
                            onUndo={handleUndoComplete}
                            isAnalyzing={isAnalyzing}
                            selectedIndices={selectedIndices}
                            onToggleSelection={handleToggleSelection}
                        />
                    </div>

                    {/* Right: Form */}
                    <div className="bg-slate-50 rounded-xl p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 text-center">
                                2. 분석 결과 확인
                            </h3>
                            {ocrResults.length > 0 && (
                                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                    {currentIndex + 1} / {ocrResults.length}
                                </span>
                            )}
                        </div>

                        <div className="h-full overflow-y-auto pr-2">
                            {/* key를 currentIndex로 설정하여 데이터 변경 시 폼을 새로 그림 */}
                            <TransactionForm
                                id="ocr-transaction-form"
                                key={currentIndex}
                                initialData={currentFormData}
                                onSubmit={handleFormSubmit}
                            />
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
                    {/* 다중 선택 시 일괄 작업 버튼 표시 */}
                    {selectedIndices.length > 0 ? (
                        <div className="flex gap-2 w-full justify-between items-center">
                            <span className="text-sm font-semibold text-slate-600">{selectedIndices.length}개 선택됨</span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    className="h-10 px-4 rounded-lg bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition"
                                >
                                    삭제
                                </button>
                                {/* 분석 완료 후에만 재분석 및 일괄 저장 버튼 표시 */}
                                {ocrResults.length > 0 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleBulkRetry}
                                            className="h-10 px-4 rounded-lg bg-orange-100 text-orange-600 font-semibold hover:bg-orange-200 transition"
                                        >
                                            재분석
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleBulkSave}
                                            className="h-10 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                                        >
                                            일괄 저장
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {ocrResults.length > 0 && currentIndex < ocrResults.length - 1 && (
                                <button
                                    type="button"
                                    onClick={handleSkip}
                                    className="mr-auto text-slate-500 hover:text-slate-700 text-sm font-medium px-2"
                                >
                                    이 항목 건너뛰기
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isAnalyzing}
                                className="h-11 px-6 rounded-full bg-white border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                취소
                            </button>

                            {/* 분석 전에는 '분석 요청', 분석 후에는 '저장하기' (마지막이면 '완료' 등) */}
                            {ocrResults.length === 0 ? (
                                <button
                                    type="button"
                                    onClick={handleAnalyze}
                                    disabled={files.length === 0 || isAnalyzing}
                                    className="h-11 px-6 rounded-full bg-teal-600 text-white font-semibold shadow-sm hover:bg-teal-700 transition disabled:bg-teal-300 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isAnalyzing ? '분석 중...' : '분석 요청'}
                                </button>
                            ) : (
                                <>
                                    {failedIndices.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleRetryFailed}
                                            disabled={isAnalyzing}
                                            className="h-11 px-6 rounded-full bg-orange-500 text-white font-semibold shadow-sm hover:bg-orange-600 transition disabled:bg-orange-300 disabled:cursor-not-allowed"
                                        >
                                            실패 항목 재분석
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        form="ocr-transaction-form"
                                        className="h-11 px-6 rounded-full bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition"
                                    >
                                        {currentIndex < ocrResults.length - 1 ? '저장하고 다음' : '저장하고 완료'}
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
