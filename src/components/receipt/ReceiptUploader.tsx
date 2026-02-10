import {useState, useRef, useEffect} from 'react';
import type {FC, ChangeEvent, DragEvent} from 'react';

type ReceiptUploaderProps = {
    files?: File[]; // 외부에서 제어되는 파일 목록
    onFilesChange: (files: File[]) => void;
    currentIndex?: number;
    onIndexChange?: (index: number) => void;
    completedIndices?: number[]; // 완료된 인덱스 목록
    failedIndices?: number[]; // 분석 실패한 인덱스 목록
    onRemoveFile?: (index: number) => void; // 파일 삭제 시 호출될 콜백
    onUndo?: (index: number) => void; // 확인 취소 시 호출될 콜백
    isAnalyzing?: boolean; // 분석 중 여부

    // 다중 선택 관련 Props
    selectedIndices?: number[];
    onToggleSelection?: (index: number) => void;
    viewMode?: 'slider' | 'grid';
    onViewModeChange?: (mode: 'slider' | 'grid') => void;
};

// --- 슬라이더 뷰 컴포넌트 ---
const PreviewSlider: FC<{
    previews: string[];
    activeIndex: number;
    onIndexChange: (index: number) => void;
    onRemove: (index: number) => void;
    onAddMore: () => void;
    onUndo?: (index: number) => void;
    completedIndices: number[];
    failedIndices: number[];
    isAnalyzing: boolean;
}> = ({
          previews,
          activeIndex,
          onIndexChange,
          onRemove,
          onAddMore,
          onUndo,
          completedIndices,
          failedIndices,
          isAnalyzing
      }) => {

    const goToPrev = () => {
        if (isAnalyzing) return;
        const next = activeIndex === 0 ? previews.length - 1 : activeIndex - 1;
        onIndexChange(next);
    };

    const goToNext = () => {
        if (isAnalyzing) return;
        const next = activeIndex === previews.length - 1 ? 0 : activeIndex + 1;
        onIndexChange(next);
    };

    if (previews.length === 0) return null;

    const safeIndex = Math.min(Math.max(0, activeIndex), previews.length - 1);
    const currentSrc = previews[safeIndex];
    const isCompleted = completedIndices.includes(safeIndex);
    const isFailed = !isCompleted && failedIndices.includes(safeIndex);

    return (
        <div className={`relative w-full h-full ${isAnalyzing ? 'pointer-events-none opacity-70' : ''}`}>
            {/* 이미지 표시 영역 */}
            <div
                className={`relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-slate-200 group border-2 ${isCompleted ? 'border-green-500' : isFailed ? 'border-red-500' : 'border-transparent'}`}>
                <img src={currentSrc} alt={`영수증 미리보기 ${safeIndex + 1}`}
                     className="h-full w-full object-contain"/>

                {/* 완료 표시 및 취소 버튼 */}
                {isCompleted && (
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                        {onUndo && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUndo(safeIndex);
                                }}
                                className="bg-white text-slate-500 rounded-full p-1 shadow-md hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                title="확인 취소"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                     fill="currentColor">
                                    <path fillRule="evenodd"
                                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                          clipRule="evenodd"/>
                                </svg>
                            </button>
                        )}
                        <div className="bg-green-500 text-white rounded-full p-1 shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                 fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                )}

                {/* 실패 표시 */}
                {isFailed && (
                    <div
                        className="absolute top-3 right-3 z-10 bg-red-500 text-white rounded-full p-1 shadow-md animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                             fill="currentColor">
                            <path fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"/>
                        </svg>
                    </div>
                )}

                {/* 컨트롤 버튼 (좌/우) */}
                {previews.length > 1 && (
                    <>
                        <button onClick={goToPrev}
                                disabled={isAnalyzing}
                                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100 z-20 disabled:opacity-0">
                            ‹
                        </button>
                        <button onClick={goToNext}
                                disabled={isAnalyzing}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100 z-20 disabled:opacity-0">
                            ›
                        </button>
                    </>
                )}

                {/* 상단 정보 (카운터, 삭제 버튼) */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                    <span
                        className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {safeIndex + 1} / {previews.length}
                    </span>
                </div>

                {!isCompleted && (
                    <div className="absolute top-3 right-12 z-20">
                        <button onClick={() => onRemove(safeIndex)}
                                disabled={isAnalyzing}
                                className="rounded-full bg-red-500/80 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 backdrop-blur-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            삭제
                        </button>
                    </div>
                )}

                {/* 하단 액션 버튼 (파일 추가) */}
                <div className="absolute bottom-3 right-3 z-20">
                    <button
                        type="button"
                        onClick={onAddMore}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-slate-800/90 text-white text-xs font-semibold shadow-md hover:bg-slate-900 backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="text-lg leading-none">+</span> 추가
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 그리드 뷰 컴포넌트 ---
const GridPreview: FC<{
    previews: string[];
    activeIndex: number;
    onIndexChange: (index: number) => void;
    completedIndices: number[];
    failedIndices: number[];
    onAddMore: () => void;
    onRemove: (index: number) => void;
    onUndo?: (index: number) => void;
    isAnalyzing: boolean;
    selectedIndices: number[];
    onToggleSelection: (index: number) => void;
}> = ({
          previews,
          activeIndex,
          onIndexChange,
          completedIndices,
          failedIndices,
          onAddMore,
          onRemove,
          onUndo,
          isAnalyzing,
          selectedIndices,
          onToggleSelection
      }) => {
    return (
        <div className={`w-full h-full overflow-y-auto p-1 ${isAnalyzing ? 'pointer-events-none opacity-70' : ''}`}>
            <div className="grid grid-cols-3 gap-3">
                {previews.map((src, index) => {
                    const isCompleted = completedIndices.includes(index);
                    const isFailed = !isCompleted && failedIndices.includes(index);
                    const isActive = index === activeIndex;
                    const isSelected = selectedIndices.includes(index);

                    return (
                        <div
                            key={index}
                            onClick={() => !isAnalyzing && onIndexChange(index)}
                            className={`
                                relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group
                                ${isActive ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                                ${isCompleted ? 'border-green-500' : isFailed ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}
                            `}
                        >
                            <img src={src} alt={`미리보기 ${index + 1}`} className="w-full h-full object-cover"/>

                            {/* 선택 체크박스 (좌상단) */}
                            <div
                                className="absolute top-1 left-1 z-20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isAnalyzing) onToggleSelection(index);
                                }}
                            >
                                <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-black/40 border-white hover:bg-black/60'}`}>
                                    {isSelected && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white"
                                             viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd"
                                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                  clipRule="evenodd"/>
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* 삭제 버튼 (완료되지 않은 경우에만 표시) */}
                            {!isCompleted && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isAnalyzing) onRemove(index);
                                    }}
                                    disabled={isAnalyzing}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:bg-red-600 z-10 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="삭제"
                                >
                                    <span className="text-xs font-bold leading-none mb-0.5">-</span>
                                </button>
                            )}

                            {/* 완료 체크 표시 및 취소 버튼 */}
                            {isCompleted && (
                                <div
                                    className="absolute inset-0 bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                                    <div className="flex gap-2">
                                        {onUndo && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isAnalyzing) onUndo(index);
                                                }}
                                                className="bg-white text-slate-500 rounded-full p-1 shadow-sm hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                                title="확인 취소"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                                     viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd"
                                                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                                          clipRule="evenodd"/>
                                                </svg>
                                            </button>
                                        )}
                                        <div className="bg-green-500 text-white rounded-full p-1 shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                                 viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd"
                                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                      clipRule="evenodd"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 실패 경고 표시 */}
                            {isFailed && (
                                <div
                                    className="absolute top-1 right-7 bg-red-500 text-white rounded-full p-0.5 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20"
                                         fill="currentColor">
                                        <path fillRule="evenodd"
                                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                              clipRule="evenodd"/>
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* 추가 버튼 (그리드 마지막) */}
                <button
                    onClick={onAddMore}
                    disabled={isAnalyzing}
                    className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="text-2xl">+</span>
                    <span className="text-xs font-medium">추가</span>
                </button>
            </div>
        </div>
    );
};


export default function ReceiptUploader({
                                            onFilesChange,
                                            currentIndex: controlledIndex,
                                            onIndexChange,
                                            completedIndices = [],
                                            failedIndices = [],
                                            onRemoveFile,
                                            onUndo,
                                            isAnalyzing = false,
                                            selectedIndices = [],
                                            onToggleSelection,
                                            viewMode: controlledViewMode,
                                            onViewModeChange,
                                            files: externalFiles // 외부에서 주입받는 파일 목록
                                        }: ReceiptUploaderProps) {
    // 내부 상태 files는 externalFiles가 없을 때만 사용 (하위 호환성)
    const [internalFiles, setInternalFiles] = useState<File[]>([]);
    const files = externalFiles || internalFiles;

    const [previews, setPreviews] = useState<string[]>([]);
    const [internalIndex, setInternalIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [internalViewMode, setInternalViewMode] = useState<'slider' | 'grid'>('slider');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const objectUrlsRef = useRef<string[]>([]);

    const isControlled = controlledIndex !== undefined;
    const activeIndex = isControlled ? controlledIndex : internalIndex;

    const viewMode = controlledViewMode || internalViewMode;

    const handleIndexChange = (index: number) => {
        if (isAnalyzing) return;
        if (!isControlled) {
            setInternalIndex(index);
        }
        onIndexChange?.(index);
    };

    const handleViewModeChange = (mode: 'slider' | 'grid') => {
        if (isAnalyzing) return;
        if (onViewModeChange) {
            onViewModeChange(mode);
        } else {
            setInternalViewMode(mode);
        }
    };

    // 내부 선택 상태 관리 (부모에서 전달받지 않은 경우)
    const [internalSelectedIndices, setInternalSelectedIndices] = useState<number[]>([]);
    const activeSelectedIndices = onToggleSelection ? selectedIndices : internalSelectedIndices;

    const handleToggleSelection = (index: number) => {
        if (onToggleSelection) {
            onToggleSelection(index);
        } else {
            setInternalSelectedIndices(prev =>
                prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
            );
        }
    };

    // files가 변경될 때마다 미리보기 생성
    useEffect(() => {
        // 기존 URL 정리
        objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        objectUrlsRef.current = [];

        const newPreviews = files.map(file => {
            const url = URL.createObjectURL(file);
            objectUrlsRef.current.push(url);
            return url;
        });
        setPreviews(newPreviews);

        // 컴포넌트 언마운트 시 정리
        return () => {
            objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
            objectUrlsRef.current = [];
        };
    }, [files]);

    const processFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;

        const fileArray = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
        if (fileArray.length === 0) return;

        const updatedFiles = [...files, ...fileArray];

        // 외부 제어 방식이면 콜백만 호출
        if (externalFiles) {
            onFilesChange(updatedFiles);
        } else {
            setInternalFiles(updatedFiles);
            onFilesChange(updatedFiles);
        }
    };

    const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        processFiles(event.target.files);
        if (event.target) {
            event.target.value = "";
        }
    };

    const handleAddMoreClick = () => {
        if (isAnalyzing) return;
        fileInputRef.current?.click();
    };

    const handleRemove = (indexToRemove: number) => {
        if (isAnalyzing) return;

        // 부모에게 삭제 알림 (부모가 files를 관리하면 부모가 삭제 처리)
        if (onRemoveFile) {
            onRemoveFile(indexToRemove);
        } else {
            // 내부 관리 시 직접 삭제
            const updatedFiles = files.filter((_, index) => index !== indexToRemove);
            setInternalFiles(updatedFiles);
            onFilesChange(updatedFiles);

            // 인덱스 조정
            if (updatedFiles.length === 0) {
                handleIndexChange(0);
            } else if (activeIndex >= updatedFiles.length) {
                handleIndexChange(updatedFiles.length - 1);
            } else if (indexToRemove < activeIndex) {
                handleIndexChange(activeIndex - 1);
            }
        }
    };

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAnalyzing) setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!isAnalyzing) processFiles(e.dataTransfer.files);
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* 뷰 전환 버튼 (파일이 있을 때만 표시) */}
            {files.length > 0 && (
                <div className="flex justify-end mb-2">
                    <div
                        className={`bg-slate-100 p-1 rounded-lg flex gap-1 ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
                        <button
                            type="button"
                            onClick={() => handleViewModeChange('slider')}
                            disabled={isAnalyzing}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'slider' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                            title="슬라이드 보기"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleViewModeChange('grid')}
                            disabled={isAnalyzing}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                            title="모아보기"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div
                className={`relative rounded-2xl p-4 text-center transition-colors duration-200 flex-grow flex flex-col justify-center ${
                    files.length === 0 ? `border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}` : ''
                } ${isAnalyzing ? 'pointer-events-none opacity-70' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                />

                {files.length > 0 ? (
                    viewMode === 'slider' ? (
                        <PreviewSlider
                            previews={previews}
                            activeIndex={activeIndex}
                            onIndexChange={handleIndexChange}
                            onRemove={handleRemove}
                            onAddMore={handleAddMoreClick}
                            completedIndices={completedIndices}
                            failedIndices={failedIndices}
                            isAnalyzing={isAnalyzing}
                            onUndo={onUndo}
                        />
                    ) : (
                        <GridPreview
                            previews={previews}
                            activeIndex={activeIndex}
                            onIndexChange={(index) => {
                                handleIndexChange(index);
                            }}
                            completedIndices={completedIndices}
                            failedIndices={failedIndices}
                            onAddMore={handleAddMoreClick}
                            onRemove={handleRemove}
                            isAnalyzing={isAnalyzing}
                            onUndo={onUndo}
                            selectedIndices={activeSelectedIndices}
                            onToggleSelection={handleToggleSelection}
                        />
                    )
                ) : (
                    <div className="space-y-3">
                        <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none"
                             viewBox="0 0 48 48" aria-hidden="true">
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p className="text-sm text-slate-600">
                            영수증 이미지를 드래그하거나, 버튼을 눌러 선택해주세요.
                        </p>
                        <button
                            type="button"
                            onClick={handleAddMoreClick}
                            disabled={isAnalyzing}
                            className="h-10 px-5 rounded-full bg-slate-800 text-white text-sm font-semibold shadow-sm hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            파일 선택
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
