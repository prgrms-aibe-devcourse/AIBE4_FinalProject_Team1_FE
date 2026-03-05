import apiClient from './client.ts';
import type {
  StockOrderDeductionRequest,
  StockDeductionResponse,
} from '@/types';

/**
 * 주문 재고 차감
 * POST /api/stock/{storePublicId}/deduct
 */
export async function deductStock(storePublicId: string, request: StockOrderDeductionRequest): Promise<StockDeductionResponse> {
  const response = await apiClient.post<StockDeductionResponse>(`/api/stock/${storePublicId}/deduct`, request);
  return response.data;
}

