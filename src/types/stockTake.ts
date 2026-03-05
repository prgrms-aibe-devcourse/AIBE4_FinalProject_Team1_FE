export type StockTakeStatus = 'DRAFT' | 'CONFIRMED';

export interface StockTakeItemRequest {
    ingredientId: number;
    stockTakeQty: number;
}

export interface StockTakeCreateRequest {
    title: string;
    items: StockTakeItemRequest[];
}

export interface StockTakeSheetResponse {
    sheetId: number;
    title: string;
    status: StockTakeStatus;
    createdAt: string;
}
