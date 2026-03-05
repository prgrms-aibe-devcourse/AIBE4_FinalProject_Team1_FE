import apiClient from './client.ts';
import type {
    StockTakeSheetResponse,
    StockTakeCreateRequest,
} from '../types/stockTake.ts';

/**
 * 재고 실사 시트 목록 조회
 * GET /api/stocktakes/{storePublicId}
 */
export async function getStockTakeSheets(storePublicId: string): Promise<StockTakeSheetResponse[]> {
    const response = await apiClient.get<StockTakeSheetResponse[]>(`/api/stocktakes/${storePublicId}`);
    return response.data;
}

/**
 * 재고 실사 시트 생성
 * POST /api/stocktakes/{storePublicId}
 */
export async function createStockTakeSheet(
    storePublicId: string,
    request: StockTakeCreateRequest
): Promise<string> {
    const response = await apiClient.post<string>(`/api/stocktakes/${storePublicId}`, request);
    return response.data;
}

/**
 * 재고 실사 확정
 * POST /api/stocktakes/{storePublicId}/{sheetId}/confirm
 */
export async function confirmStockTakeSheet(
    storePublicId: string,
    sheetPublicId: string
): Promise<void> {
    await apiClient.post<void>(`/api/stocktakes/${storePublicId}/${sheetPublicId}/confirm`);
}
