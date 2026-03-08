import apiClient from './client.ts';
import type {
    Pagination,
    StockOrderDeductionRequest,
    StockDeductionResponse,
    StocktakeCreateRequest,
    StocktakeSheetResponse,
    StockInboundResponse,
    DisposalRequest,
    DisposalResponse,
    DisposalSearchCondition, StockSummaryResponse, StockBatchResponse, StockSearchCondition,
} from '@/types';
import type {StockLogResponse, StockLogSearchCondition} from "@/types/stockLog.ts";

/**
 * 주문 재고 차감
 * POST /api/stock/{storePublicId}/deduct
 */
export async function deductStock(storePublicId: string, request: StockOrderDeductionRequest): Promise<StockDeductionResponse> {
    const response = await apiClient.post<StockDeductionResponse>(`/api/stock/${storePublicId}/deduct`, request);
    return response.data;
}

/**
 * 재고 실사 시트 목록 조회
 * GET /api/stocktakes/{storePublicId}
 */
export async function getStocktakeSheets(storePublicId: string): Promise<StocktakeSheetResponse[]> {
    const response = await apiClient.get<StocktakeSheetResponse[]>(`/api/stocktakes/${storePublicId}`);
    return response.data;
}

/**
 * 재고 실사 시트 생성
 * POST /api/stocktakes/{storePublicId}
 */
export async function createStocktakeSheet(storePublicId: string, request: StocktakeCreateRequest): Promise<number> {
    const response = await apiClient.post<number>(`/api/stocktakes/${storePublicId}`, request);
    return response.data;
}

/**
 * 재고 실사 확정
 * POST /api/stocktakes/{storePublicId}/{sheetId}/confirm
 */
export async function confirmStocktakeSheet(storePublicId: string, sheetId: number): Promise<void> {
    await apiClient.post<void>(`/api/stocktakes/${storePublicId}/${sheetId}/confirm`);
}

/** * --- 입고(Inbound) 관련 API 추가 ---
 */

/**
 * 입고 내역 목록 조회
 * GET /api/inbounds/{storePublicId}
 */
export const getStockInbounds = async (storePublicId: string): Promise<Pagination<StockInboundResponse>> => {
    const response = await apiClient.get(`/stock/${storePublicId}/inbound`);
    return response.data;
};

/**
 * 입고 상세 정보 조회 (UUID 기반)
 * GET /api/inbounds/{storePublicId}/{inboundPublicId}
 */
export async function getStockInboundDetail(
    storePublicId: string,
    inboundPublicId: string
): Promise<StockInboundResponse> {
    const response = await apiClient.get<StockInboundResponse>(
        `/api/inbounds/${storePublicId}/${inboundPublicId}`
    );
    return response.data;
}

/**
 * 입고 확정 처리
 * POST /api/inbounds/{storePublicId}/{inboundPublicId}/confirm
 */
export async function confirmInbound(
    storePublicId: string,
    inboundPublicId: string
): Promise<StockInboundResponse> {
    const response = await apiClient.post<StockInboundResponse>(
        `/api/inbounds/${storePublicId}/${inboundPublicId}/confirm`
    );
    return response.data;
}

/** * --- 폐기(Disposal) 관련 API 추가 ---
 */

/**
 * 폐기 등록 처리
 * POST /api/disposal/{storePublicId}
 */
export async function recordWaste(storePublicId: string, request: DisposalRequest): Promise<void> {
    await apiClient.post<DisposalResponse[]>(`/api/disposal/${storePublicId}`, request);
}

/**
 * 폐기 목록 조회
 * GET /api/disposal/{storePublicId}
 */

export async function getWasteRecords(storePublicId: string, condition: DisposalSearchCondition, page: number = 0, size: number = 20): Promise<Pagination<DisposalResponse>> {
    const response = await apiClient.get<Pagination<DisposalResponse>>(`/api/disposal/${storePublicId}`, {
        params: {
            ...condition,
            page,
            size,
            sort: 'wasteAt,desc'
        },
    });
    return response.data;
}

/**
 * 1. 매장 전체 재고 요약 목록 조회 (무한 스크롤/검색용)
 * 폐기 시 품목 검색도 이 API를 사용합니다.
 */
export const getStoreStockSummary = async (
    storePublicId: string,
    condition: StockSearchCondition,
    page: number = 0,
    size: number = 20
): Promise<Pagination<StockSummaryResponse>> => {
    const response = await apiClient.get<Pagination<StockSummaryResponse>>(
        `/api/stock/${storePublicId}/stocks`,
        {params: {...condition, page, size}}
    );
    return response.data;
};

/**
 * 2. 특정 품목의 상세 배치 목록 조회
 * 품목을 선택했을 때 어떤 배치를 폐기할지 결정하기 위해 호출합니다.
 */
export const getIngredientBatchDetails = async (
    storePublicId: string,
    ingredientPublicId: string
): Promise<StockBatchResponse[]> => {
    const response = await apiClient.get<StockBatchResponse[]>(
        `/api/stock/${storePublicId}/${ingredientPublicId}/batches`
    );
    return response.data;
};

/** * --- 이력(Log) 관련 API 추가 ---
 */

/**
 * 재고 이력 조회
 * GET /api/stockLogs/{storePublicId}
 */
export async function getStockLogs(storePublicId: string, condition: StockLogSearchCondition, page: number = 0, size: number = 20): Promise<Pagination<StockLogResponse>> {
    const response = await apiClient.get<Pagination<StockLogResponse>>(`/api/stockLogs/${storePublicId}`, {
        params: {
            ...condition,
            page,
            size,
            sort: 'createdAt,desc'
        },
    });
    return response.data;
}