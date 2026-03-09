// --- Common API Types ---

/**
 * 공통 API 응답 래퍼
 */
export interface ApiResponse<T> {
    status: 'success' | 'error';
    code: string;
    message: string | null;
    path: string;
    timestamp: string;
    data: T;
}

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
