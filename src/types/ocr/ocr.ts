export type FieldStatus = "GREEN" | "YELLOW" | "RED";

export interface Field<T> {
    value: T | null;
    status: FieldStatus;
    message: string | null;
}

export interface VendorField {
    id: Field<string>;
    name: Field<string>;
}

export interface IngredientField {
    id: Field<number>;
    name: Field<string>;
}

export interface Item {
    ingredient: IngredientField;
    quantity: Field<string>;
    rawCapacity: Field<string>;
    costPrice: Field<string>;
    totalPrice: Field<string>;
    expirationDate: Field<string>;
}

export interface ReceiptResponse {
    documentPath: string;
    vendor: VendorField;
    date: Field<string>;
    amount: Field<string>;
    items: Item[];
}
