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
