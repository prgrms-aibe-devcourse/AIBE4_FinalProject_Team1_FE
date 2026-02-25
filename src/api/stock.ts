import apiClient from './client.ts';
import type {
  StockOrderDeductionRequest,
  StockDeductionResponse,
  StocktakeCreateRequest,
  StocktakeSheetResponse,
} from '@/types';

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
