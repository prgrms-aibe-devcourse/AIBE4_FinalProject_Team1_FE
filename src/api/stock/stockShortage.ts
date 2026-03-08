import apiClient from '../user/client.ts';
import type {
    StockShortageResponse,
    StockShortageSearchParams
} from '../../types/stock/stockShortage.ts';

/**
 * 재고 부족 목록 조회
 * GET /api/stock-shortages/{storePublicId}
 */
export async function getStockShortages(
    storePublicId: string,
    searchParams: StockShortageSearchParams = {}
): Promise<StockShortageResponse> {
    const {
        page = 0,
        size = 20,
        from,
        to
    } = searchParams;

    const response = await apiClient.get<StockShortageResponse>(
        `/api/stock-shortages/${storePublicId}`,
        {
            params: {
                page,
                size,
                sort: 'createdAt,desc',
                ...(from && { from }),
                ...(to && { to })
            }
        }
    );

    return response.data;
}