import type {IngredientUnit} from "@/types/ingredient.ts";

export type StockBatchStatus = 'OPEN' | 'CLOSED';

// --- Stock Deduction Types ---
export interface StockOrderDeductionRequest {
    storeId: number;
    salesOrderId: number;
}

export interface StockDeductionResponse {
    salesOrderId: number;
    message: string;
}

// --- Stocktake Types ---
export type StocktakeStatus = 'DRAFT' | 'CONFIRMED';

export interface StocktakeItemRequest {
    ingredientId: number;
    stocktakeQty: number;
}

export interface StocktakeCreateRequest {
    title: string;
    items: StocktakeItemRequest[];
}

export interface StocktakeSheetResponse {
    sheetId: number;
    title: string;
    status: StocktakeStatus;
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

// --- StockQuery Types ---

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

