export type StockTakeStatus = 'DRAFT' | 'CONFIRMED';

export interface StockTakeItemRequest {
    ingredientPublicId: string;
    stockTakeQty: number;
}

export interface StockTakeCreateRequest {
    title: string;
    items: StockTakeItemRequest[];
}

export interface StockTakeItemDraftUpdateRequest {
    ingredientPublicId: string;
    stockTakeQty: number;
}

export interface StockTakeItemsDraftUpdateRequest {
    items: StockTakeItemDraftUpdateRequest[];
}

export interface StockTakeSheetResponse {
    sheetPublicId: string;
    title: string;
    status: StockTakeStatus;
    createdAt: string;
}

export interface StockTakeItemResponse {
    ingredientPublicId: string;
    name: string;
    unit: string;
    theoreticalQty: number;
    stockTakeQty: number;
    varianceQty: number;
}

export interface StockTakeDetailResponse {
    sheetPublicId: string;
    title: string;
    status: StockTakeStatus;
    createdAt: string;
    items: StockTakeItemResponse[];
}

