export type StockTakeStatus = 'DRAFT' | 'CONFIRMED';

export interface StockTakeItemRequest {
    ingredientPublicId: string;
    stockTakeQty: number;
}

export interface StockTakeCreateRequest {
    title: string;
    items: StockTakeItemRequest[];
}

export interface StockTakeSheetResponse {
    sheetPublicId: string;
    title: string;
    status: StockTakeStatus;
    createdAt: string;
}
