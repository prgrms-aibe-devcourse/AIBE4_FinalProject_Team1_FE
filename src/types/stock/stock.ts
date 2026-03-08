export interface StockOrderDeductionRequest {
    storeId: number;
    salesOrderId: number;
}

export interface StockDeductionResponse {
    salesOrderId: number;
    message: string;
}

export type InboundStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export type ResolutionStatus =
    | 'AUTO_SUGGESTED'
    | 'CONFIRMED'
    | 'FAILED';

export interface StockInboundItemResponse {
    inboundItemId: number;
    inboundItemPublicId: string;
    inboundId: number;
    ingredientId: number | null;
    ingredientName: string | null;
    rawProductName: string;
    normalizedRawKey: string | null;
    quantity: number;
    unitCost: number;
    expirationDate: string | null;
    resolutionStatus: ResolutionStatus;
    specText: string | null;
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

export interface StockInboundListResponse {
    inboundId: number;
    inboundPublicId: string;
    storeId: number;
    storeName: string;
    vendorId: number | null;
    vendorName: string | null;
    status: InboundStatus;
    confirmedByUserId: number | null;
    confirmedByUserName: string | null;
    confirmedAt: string | null;
    createdAt: string;
}

export interface Candidate {
    ingredientPublicId: string;
    ingredientName: string;
    ingredientUnit: string;
    score: number;
}

export interface BulkResolveResponse {
    totalCount: number;
    autoResolvedCount: number;
    pendingCount: number;
    failedCount: number;
    skippedCount: number;
}

export interface BulkIngredientConfirmItem {
    inboundItemPublicId: string;
    chosenIngredientPublicId: string;
}

export interface BulkProductNormalizeResponse {
    totalCount: number;
    normalizedCount: number;
    skippedCount: number;
    failedCount: number;
}

export interface ManualInboundItemRequest {
    rawProductName: string;
    quantity: number;
    unitCost: number;
    expirationDate: string | null;
    specText: string | null;
}

export interface ManualInboundRequest {
    vendorPublicId: string | null;
    inboundDate: string;
    items: ManualInboundItemRequest[];
}

export interface StockInboundItemRequest {
    rawProductName: string;
    quantity: number;
    unitCost: number;
    expirationDate: string | null;
    specText: string | null;
}

export interface StockInboundRequest {
    vendorId: number | null;
    sourceDocumentId: number;
    sourcePurchaseOrderId: number;
    items: StockInboundItemRequest[];
}