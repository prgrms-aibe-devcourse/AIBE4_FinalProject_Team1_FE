import apiClient from '../user/client.ts';
import type { SalesOrderResponse } from '@/types/sales/salesOrder.ts';
import type { PageResponse } from '@/types/common/common';

/**
 * 매장 주문 목록 조회
 * GET /api/orders/{storePublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param params 페이지네이션 파라미터
 */
export const getSalesOrders = (storePublicId: string, params?: { page?: number; size?: number }) =>
    apiClient.get<PageResponse<SalesOrderResponse>>(`/api/orders/${storePublicId}`, { params });

/**
 * 주문 상세 조회
 * GET /api/orders/{storePublicId}/{orderPublicId}
 */
export const getSalesOrderDetail = async (
    storePublicId: string,
    orderPublicId: string
): Promise<SalesOrderResponse> => {
    const response = await apiClient.get<SalesOrderResponse>(
        `/api/orders/${storePublicId}/${orderPublicId}`
    );
    return response.data;
};

/**
 * 환불 처리
 * POST /api/orders/{storePublicId}/{orderPublicId}/refund
 */
export const refundSalesOrder = async (
    storePublicId: string,
    orderPublicId: string
): Promise<SalesOrderResponse> => {
    const response = await apiClient.post<SalesOrderResponse>(
        `/api/orders/${storePublicId}/${orderPublicId}/refund`
    );
    return response.data;
};