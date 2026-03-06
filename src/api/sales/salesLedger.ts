import apiClient from '../user/client.ts';
import type {
    SalesLedgerOrderDetailResponse,
    SalesLedgerOrderListResponse,
    SalesLedgerSearchParams,
} from '@/types/sales/salesLedger.ts';

export const getSalesLedgerOrders = async (
    storePublicId: string,
    params: SalesLedgerSearchParams
): Promise<SalesLedgerOrderListResponse> => {
    const response = await apiClient.get<SalesLedgerOrderListResponse>(
        `/api/sales/${storePublicId}/orders`,
        { params }
    );
    return response.data;
};

export const getSalesLedgerOrderDetail = async (
    storePublicId: string,
    orderPublicId: string
): Promise<SalesLedgerOrderDetailResponse> => {
    const response = await apiClient.get<SalesLedgerOrderDetailResponse>(
        `/api/sales/${storePublicId}/orders/${orderPublicId}`
    );
    return response.data;
};