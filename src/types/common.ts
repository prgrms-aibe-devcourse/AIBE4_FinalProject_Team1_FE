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
