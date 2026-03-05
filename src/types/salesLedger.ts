import type { Pagination } from './common';

export type SalesLedgerOrderStatus = 'COMPLETED' | 'REFUNDED';
export type SalesLedgerOrderType = 'DINE_IN' | 'TAKEOUT';

export interface SalesLedgerOrderSummaryResponse {
    orderPublicId: string;
    status: SalesLedgerOrderStatus;
    type: SalesLedgerOrderType;
    orderedAt: string;
    completedAt: string;
    refundedAt: string | null;
    tableCode: string;
    itemCount: number;
    totalAmount: number;
    refundAmount: number;
    netAmount: number;
}

export interface SalesLedgerOrderItemResponse {
    menuName: string;
    price: number;
    quantity: number;
    subtotal: number;
}

export interface SalesLedgerOrderDetailResponse {
    orderPublicId: string;
    status: SalesLedgerOrderStatus;
    type: SalesLedgerOrderType;
    orderedAt: string;
    completedAt: string;
    refundedAt: string | null;
    tableCode: string;
    itemCount: number;
    totalAmount: number;
    refundAmount: number;
    netAmount: number;
    items: SalesLedgerOrderItemResponse[];
}

export type SalesLedgerOrderListResponse = Pagination<SalesLedgerOrderSummaryResponse>;

export interface SalesLedgerSearchParams {
    from: string;
    to: string;
    status?: SalesLedgerOrderStatus;
    type?: SalesLedgerOrderType;
    page?: number;
    size?: number;
}