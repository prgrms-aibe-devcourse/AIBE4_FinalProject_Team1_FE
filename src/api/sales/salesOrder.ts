import apiClient from '../user/client.ts';
import type { SalesOrderListResponse, SalesOrderResponse } from '@/types/sales/salesOrder.ts';

/**
 * 매장 주문 목록 조회
 * GET /api/orders/{storePublicId}
 */
export const getSalesOrders = async (
    storePublicId: string
): Promise<SalesOrderListResponse> => {
    const response = await apiClient.get<SalesOrderListResponse>(
        `/api/orders/${storePublicId}`
    );
    return response.data;
};

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