import type { Pagination } from '../common/common';

export interface StockShortageItem {
    stockShortagePublicId: string;
    ingredientPublicId: string;
    ingredientName: string;
    unit: string;
    requiredAmount: number;
    shortageAmount: number;
}

export interface StockShortageGroup {
    salesOrderPublicId: string;
    shortages: StockShortageItem[];
    createdAt: string;
}

export interface StockShortageSearchParams {
    page?: number;
    size?: number;
    from?: string;
    to?: string;
}

export type StockShortageResponse = Pagination<StockShortageGroup>;