import apiClient from '../user/client.ts';
import type {
    StockTakeSheetResponse,
    StockTakeCreateRequest,
    StockTakeDetailResponse,
    StockTakeItemsDraftUpdateRequest,
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
    const response = await apiClient.get<StockTakeDetailResponse>(`/api/stocktakes/${storePublicId}/${sheetPublicId}`);
    return response.data;
}

/**
 * 재고 실사 시트 생성
 * POST /api/stocktakes/{storePublicId}
 */
export async function createStockTakeSheet(
    storePublicId: string,
    request: StockTakeCreateRequest
): Promise<number> {
    const response = await apiClient.post<number>(`/api/stocktakes/${storePublicId}`, request);
    return response.data;
}

/**
 * 재고 실사 항목 임시저장(수정)
 * PATCH /api/stocktakes/{storePublicId}/{sheetPublicId}/items
 */
export async function updateStockTakeDraftItems(
    storePublicId: string,
    sheetPublicId: string,
    request: StockTakeItemsDraftUpdateRequest
): Promise<void> {
    await apiClient.patch<void>(`/api/stocktakes/${storePublicId}/${sheetPublicId}/items`, request);
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

