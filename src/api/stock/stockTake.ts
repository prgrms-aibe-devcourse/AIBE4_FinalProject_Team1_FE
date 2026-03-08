import apiClient from '../user/client.ts';
import type {
    StockTakeSheetResponse,
    StockTakeSheetCreateRequest,
    StockTakeDetailResponse,
    StockTakeDraftSaveRequest,
    StockTakeConfirmRequest,
} from '../../types/stock/stockTake.ts';

/**
 * 재고 실사 시트 목록 조회
 * GET /api/stocktakes/{storePublicId}
 */
export async function getStockTakeSheets(storePublicId: string): Promise<StockTakeSheetResponse[]> {
    const response = await apiClient.get<StockTakeSheetResponse[]>(`/api/stocktakes/${storePublicId}`);
    return response.data;
}

/**
 * 재고 실사 시트 상세 조회
 * GET /api/stocktakes/{storePublicId}/{sheetPublicId}
 */
export async function getStockTakeSheetDetail(
    storePublicId: string,
    sheetPublicId: string
): Promise<StockTakeDetailResponse> {
    const response = await apiClient.get<StockTakeDetailResponse>(
        `/api/stocktakes/${storePublicId}/${sheetPublicId}`
    );
    return response.data;
}

/**
 * 재고 실사 시트 생성
 * POST /api/stocktakes/{storePublicId}
 */
export async function createStockTakeSheet(
    storePublicId: string,
    request: StockTakeSheetCreateRequest
): Promise<string> {
    const response = await apiClient.post<string>(`/api/stocktakes/${storePublicId}`, request);
    return response.data;
}

/**
 * 재고 실사 초안 저장
 * PUT /api/stocktakes/{storePublicId}/{sheetPublicId}/draft
 */
export async function saveStockTakeDraft(
    storePublicId: string,
    sheetPublicId: string,
    request: StockTakeDraftSaveRequest
): Promise<void> {
    await apiClient.put<void>(`/api/stocktakes/${storePublicId}/${sheetPublicId}/draft`, request);
}

/**
 * 재고 실사 확정
 * POST /api/stocktakes/{storePublicId}/{sheetPublicId}/confirm
 */
export async function confirmStockTakeSheet(
    storePublicId: string,
    sheetPublicId: string,
    request: StockTakeConfirmRequest
): Promise<void> {
    await apiClient.post<void>(`/api/stocktakes/${storePublicId}/${sheetPublicId}/confirm`, request);
}