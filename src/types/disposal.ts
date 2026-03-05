// --- Disposal Types ---
export type DisposalReason = 'EXPIRED' | 'DAMAGED' | 'SPOILED' | 'OTHER';

export interface DisposalSearchCondition {
    startAt?: string;
    endAt?: string;
    reason?: DisposalReason;
    ingredientName?: string;
}

export interface DisposalItem {
    stockBatchId: string;
    quantity: number;
    reason: DisposalReason;
    wasteDate: string
}

export interface DisposalRequest {
    items: DisposalItem[]
}

export interface DisposalResponse {
    wastePublicId: string;
    ingredientName: string;     // 식재료명
    quantity: number;      // 폐기 수량
    reason: DisposalReason; // 폐기 사유
    amount: number;        // 폐기 금액 (수량 * 단가)
    wasteAt: string;
    recordedByUserName: string;
}
