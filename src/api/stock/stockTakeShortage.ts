import apiClient from '../user/client.ts';
import type { StockShortageResponse } from '../../types/stock/stockTakeShortage.ts';

/**
 * 재고 부족 목록 조회
 * GET /api/stock-shortages/{storePublicId}
 */
export async function getStockShortages(
    storePublicId: string,
    page: number = 0,
    size: number = 20
): Promise<StockShortageResponse> {
    const response = await apiClient.get<StockShortageResponse>(`/api/stock-shortages/${storePublicId}`, {
        params: {
            page,
            size,
            sort: 'createdAt,desc'
        }
    });
    return response.data;
}
