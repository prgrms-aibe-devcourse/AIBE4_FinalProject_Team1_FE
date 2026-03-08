import type {IngredientUnit} from "@/types/reference/ingredient";

// ── Stock Deduction ──────────────────────────────────────────────────────────
export interface StockOrderDeductionRequest {
    storeId: number;
    salesOrderId: number;
}

export interface StockDeductionResponse {
    salesOrderId: number;
    message: string;
}

// ── Inbound ──────────────────────────────────────────────────────────────────
export type InboundStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export type ResolutionStatus =
    | 'UNRESOLVED'
    | 'AUTO_RESOLVED'
    | 'PENDING'
    | 'CONFIRMED'
    | 'FAILED';

export interface StockInboundItemResponse {
    inboundItemId: number;
    inboundItemPublicId: string;
    inboundId: number;
    ingredientId: number | null;
    ingredientName: string | null;
    rawProductName: string;
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

// ── Ingredient Resolution ─────────────────────────────────────────────────────
export interface Candidate {
    ingredientPublicId: string;
    ingredientName: string;
    ingredientUnit: string;
    score: number;
}

export interface IngredientResolveResponse {
    status: ResolutionStatus;
    normalizedRawKey: string | null;
    normalizedRawFull: string | null;
    confidence: number | null;
    resolvedIngredientPublicId: string | null;
    resolvedIngredientName: string | null;
    resolvedIngredientUnit: string | null;
    candidates: Candidate[];
}

// ── Bulk Operations ───────────────────────────────────────────────────────────
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

export interface BulkIngredientConfirmRequest {
    items: BulkIngredientConfirmItem[];
}

export interface ItemConfirmResult {
    inboundItemPublicId: string;
    success: boolean;
    confirmedIngredientPublicId: string | null;
    ingredientName: string | null;
    normalizedRawKey: string | null;
    newMappingCreated: boolean;
    errorMessage: string | null;
}

export interface BulkIngredientConfirmResponse {
    totalCount: number;
    successCount: number;
    failedCount: number;
    results: ItemConfirmResult[];
}

export interface BulkProductNormalizeResponse {
    totalCount: number;
    normalizedCount: number;
    skippedCount: number;
    failedCount: number;
}

// ── Manual Inbound Creation ──────────────────────────────────────────────────
export interface ManualInboundItemRequest {
    rawProductName: string;
    quantity: number;
    unitCost: number;
    expirationDate: string | null;
    specText: string | null;
}

export interface ManualInboundRequest {
    vendorId: number | null;
    inboundDate: string;
    items: ManualInboundItemRequest[];
}

// ── Document-based Inbound Creation ──────────────────────────────────────────
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
