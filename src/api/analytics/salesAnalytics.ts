import apiClient from '../user/client.ts';
import type {
    SalesTrendData,
    SalesPeakData,
    MenuRankingData,
    SalesSummaryResponse,
    TimeInterval
} from '@/types/analytics/salesAnalytics.ts';

const BASE_URL = '/api/analytics';

/**
 * 날짜 객체를 ISO 8601 KST 포맷으로 변환 (YYYY-MM-DDTHH:mm:ss+09:00)
 */
const formatToKstIsoString = (date: Date): string => {
    // kst offset is +09:00
    const pad = (n: number) => String(n).padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
};
// 1. 매출 추이 (Trend)
export const getSalesTrend = async (
    storePublicId: string,
    from: Date,
    to: Date,
    interval: TimeInterval = 'day'
): Promise<SalesTrendData[]> => {
    const response = await apiClient.get<SalesTrendData[]>(
        `${BASE_URL}/${storePublicId}/sales/trend`,
        {
            params: {
                from: formatToKstIsoString(from),
                to: formatToKstIsoString(to),
                interval
            }
        }
    );
    return response.data;
};

// 2. 피크 타임 (Peak)
export const getSalesPeak = async (
    storePublicId: string,
    from: Date,
    to: Date
): Promise<SalesPeakData[]> => {
    const response = await apiClient.get<SalesPeakData[]>(
        `${BASE_URL}/${storePublicId}/sales/peak`,
        {
            params: {
                from: formatToKstIsoString(from),
                to: formatToKstIsoString(to)
            }
        }
    );
    return response.data;
};

// 3. 메뉴 랭킹 (Menu Ranking)
export const getMenuRanking = async (
    storePublicId: string,
    from: Date,
    to: Date,
    topN: number = 10
): Promise<MenuRankingData[]> => {
    const response = await apiClient.get<MenuRankingData[]>(
        `${BASE_URL}/${storePublicId}/sales/menu-ranking`,
        {
            params: {
                from: formatToKstIsoString(from),
                to: formatToKstIsoString(to),
                topN
            }
        }
    );
    return response.data;
};

// 4. 매출 요약 (Summary)
export const getSalesSummary = async (
    storePublicId: string,
    from: Date,
    to: Date,
    interval: TimeInterval = 'day'
): Promise<SalesSummaryResponse> => {
    const response = await apiClient.get<SalesSummaryResponse>(
        `${BASE_URL}/${storePublicId}/sales/summary`,
        {
            params: {
                from: formatToKstIsoString(from),
                to: formatToKstIsoString(to),
                interval
            }
        }
    );
    return response.data;
};
