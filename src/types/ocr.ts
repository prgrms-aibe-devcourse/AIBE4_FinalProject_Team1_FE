export type FieldStatus = "GREEN" | "YELLOW" | "RED";

export interface Field<T> {
    value: T | null;
    status: FieldStatus;
    message: string | null;
}

export interface ReceiptItem {
    name: Field<string>;
    quantity: Field<string>;
    rawCapacity: Field<string>;
    costPrice: Field<string>;
    totalPrice: Field<string>;
    expirationDate: Field<string>;
}

export interface ReceiptResponse {
    vendorName: Field<string>;
    date: Field<string>;
    amount: Field<string>;
    items: ReceiptItem[];
}