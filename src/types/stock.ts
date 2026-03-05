// --- Stock Deduction Types ---
export interface StockOrderDeductionRequest {
  storeId: number;
  salesOrderId: number;
}

export interface StockDeductionResponse {
  salesOrderId: number;
  message: string;
}

