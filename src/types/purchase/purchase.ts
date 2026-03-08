/**
 * 발주서 상태
 * - ORDERED: 발주 완료
 * - CANCELED: 발주 취소
 */
export type PurchaseOrderStatus = 'ORDERED' | 'CANCELED';

/**
 * 발주 항목
 */
export interface PurchaseOrderItem {
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineAmount: number;
}

/**
 * 발주서 요약 (목록용)
 */
export interface PurchaseOrderSummary {
    purchaseOrderPublicId: string;
    storeId: number;
    vendorPublicId: string | null;
    vendorName: string | null;
    orderNo: string;
    status: PurchaseOrderStatus;
    totalAmount: number;
}

/**
 * 발주서 상세
 */
export interface PurchaseOrderDetail extends PurchaseOrderSummary {
    canceledByUserId?: number;
    canceledAt?: string;
    items: PurchaseOrderItem[];
}

/**
 * 발주 항목 생성/수정 요청
 */
export interface PurchaseOrderItemRequest {
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
}

/**
 * 발주서 생성 요청
 */
export interface PurchaseOrderCreateRequest {
    vendorPublicId: string;
    items: PurchaseOrderItemRequest[];
}

/**
 * 발주서 수정 요청
 */
export interface PurchaseOrderUpdateRequest {
    vendorPublicId: string;
    items: PurchaseOrderItemRequest[];
}

/**
 * 발주서 검색 요청
 */
export interface PurchaseOrderSearchRequest {
    status?: PurchaseOrderStatus | '';
    search?: string;
}