import type { IngredientUnit } from "@/types/reference/ingredient";

// ── Stock Deduction ──────────────────────────────────────────────────────────
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
    normalizedRawFull?: string | null;
    quantity: number;
    unitCost: number;
    expirationDate: string | null;
    resolutionStatus: ResolutionStatus | null;
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
    inboundDate?: string | null;
    createdAt?: string | null;
    itemCount?: number;
    totalCost?: number;
    items: StockInboundItemResponse[];
}

export interface StockInboundListResponse {
    inboundPublicId: string;
    storeName: string;
    vendorPublicId: string | null;
    vendorName: string | null;
    status: InboundStatus;
    inboundDate: string | null;
    createdAt: string;
    confirmedAt: string | null;
    itemCount: number;
    totalCost: number;
}

export interface Candidate {
    ingredientPublicId: string;
    ingredientName: string;
    ingredientUnit: string;
    score: number;
}

export interface BulkResolveItemResponse {
    inboundItemPublicId: string;
    rawProductName: string;
    normalizedRawKey: string | null;
    normalizedRawFull: string | null;
    resolutionStatus: ResolutionStatus | null;
    ingredientPublicId: string | null;
    ingredientName: string | null;
}

export interface BulkResolveResponse {
    totalCount: number;
    autoResolvedCount: number;
    pendingCount?: number;
    failedCount: number;
    skippedCount: number;
    items: BulkResolveItemResponse[];
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

// --- StockQuery Types ---

export type StockBatchStatus = 'OPEN' | 'CLOSED';

export interface StockSummaryResponse {
    ingredientId: string;
    ingredientName: string;
    totalRemainingQuantity: number;
    unit: IngredientUnit;
    batchCount: number;
    minExpirationDate: string | null;
}

export interface StockBatchResponse {
    stockBatchId: number;
    rawProductName: string;
    remainingQuantity: number;
    expirationDate: string;
    createdAt: string;
    status: StockBatchStatus;
}

export interface StockSearchCondition {
    ingredientName?: string;
    includeZeroStock?: boolean;
    expiryBefore?: string;
}

export interface InboundSearchCondition {
    vendorName?: string;
    itemKeyword?: string;
    inboundPublicId?: string;
    inboundDateFrom?: string;
    inboundDateTo?: string;
}