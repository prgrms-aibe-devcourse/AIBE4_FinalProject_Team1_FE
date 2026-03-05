// --- Stock Deduction Types ---
export interface StockOrderDeductionRequest {
    storeId: number;
    salesOrderId: number;
}

export interface StockDeductionResponse {
    salesOrderId: number;
    message: string;
}


// --- StockInbound Types ---

export type InboundStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface StockInboundItemResponse {
    inboundItemId: number;
    ingredientId: number;
    ingredientName: string;
    rawProductName: string;
    quantity: number;
    unitPrice: number;
    expirationDate: string | null;
}

export interface StockInboundResponse {
    inboundId: number;
    inboundPublicId: string;
    storeId: number;
    storeName: string;
    vendorId: number | null;
    vendorName: string | null;
    sourceDocumentId: number | null;
    sourcePurchaseOrderId: number | null;
    status: InboundStatus;
    confirmedByUserId: number | null;
    confirmedByUserName: string | null;
    confirmedAt: string | null;
    items: StockInboundItemResponse[];
}