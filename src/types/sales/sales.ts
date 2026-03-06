// 매장 주문 관련 타입 정의

export type SalesOrderStatus = 'COMPLETED' | 'REFUNDED';
export type SalesOrderType = 'DINE_IN' | 'TAKEOUT';

export interface SalesOrderItemResponse {
    menuName: string;
    price: number;
    quantity: number;
    subtotal: number;
}

export interface SalesOrderResponse {
    orderPublicId: string;
    status: SalesOrderStatus;
    type: SalesOrderType;
    totalAmount: number;
    orderedAt: string;
    completedAt: string;
    refundedAt: string | null;
    tableCode: string;
    items: SalesOrderItemResponse[];
}

export type SalesOrderListResponse = SalesOrderResponse[];