import type {StockAnalyticResponse} from '@/types/analytics/stockAnalytics.ts';
import {apiClient} from "@/api";

export async function getStockAnalysis(storePublicId: string): Promise<StockAnalyticResponse[]> {
    const response = await apiClient.get<StockAnalyticResponse[]>(`/api/stock-analysis/${storePublicId}`);

    return response.data;
};