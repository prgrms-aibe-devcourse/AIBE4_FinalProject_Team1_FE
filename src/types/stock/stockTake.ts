export type StockTakeStatus = 'DRAFT' | 'CONFIRMED';

export interface StockTakeItemQuantityRequest {
    ingredientPublicId: string;
    stockTakeQty: number;
}

export interface StockTakeSheetCreateRequest {
    title: string;
    items: StockTakeItemQuantityRequest[];
}

export interface StockTakeDraftSaveRequest {
    title: string;
    items: StockTakeItemQuantityRequest[];
}

export interface StockTakeConfirmRequest {
    title: string;
    items: StockTakeItemQuantityRequest[];
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