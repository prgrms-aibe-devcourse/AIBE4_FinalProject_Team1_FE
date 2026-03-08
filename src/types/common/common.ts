// --- Common API Types ---

/**
 * 페이지네이션 응답
 */
export interface Pagination<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

/**
 * 백엔드 PageResponse DTO에 대응하는 타입
 */
export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
}

export interface DisposalPageResponse<T> {
    content: T[];           // 데이터 목록
    totalElements: number;  // 전체 아이템 수
    totalPages: number;     // 전체 페이지 수
    currentPage: number;    // 현재 페이지 (0부터 시작)
    isFirst: boolean;       // 첫 페이지 여부
    isLast: boolean;        // 마지막 페이지 여부
    hasNext: boolean;       // 다음 페이지 존재 여부
}

/**
 * API 에러 응답
 */
export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}

/**
 * 정렬 타입
 */
export type SortOrder = 'asc' | 'desc';

/**
 * 날짜 범위
 */
export interface DateRange {
    startDate: string;
    endDate: string;
}
