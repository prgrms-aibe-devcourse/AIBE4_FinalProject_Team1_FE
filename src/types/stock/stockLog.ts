export type TransactionType = "INBOUND" | "DEDUCTION" | "WASTE" | "ADJUST";
export type ReferenceType = "INBOUND" | "SALE" | "WASTE" | "STOCK_TAKING" | "OTHER"


export interface StockLogSearchCondition {
    startAt?: string;
    endAt?: string;
    type?: TransactionType | undefined;
    ingredientName?: string;
}

export interface StockLogResponse {
    createdAt?: string;
    ingredientName?: string;
    batchId?: string;
    type?: TransactionType | undefined;
    changeQuantity?: number;
    balanceAfter?: number;
    referenceType?: ReferenceType;
    referenceId?: number;
    workerName?: string;
}