export type TimeInterval = 'day' | 'week' | 'month';

// 1. 매출 추이 (Trend)
export interface SalesTrendData {
    date: string;
    orderCount: number;
    totalAmount: number;
}
// 백엔드는 SalesTrendData[] 배열 자체를 반환함

// 2. 피크 타임 (Peak)
export interface SalesPeakData {
    dayOfWeek: number; // 1(월) ~ 7(일)
    hour: number; // 0 ~ 23
    orderCount: number;
}
// 백엔드는 SalesPeakData[] 배열 자체를 반환함

// 3. 메뉴 랭킹 (Menu Ranking)
export interface MenuRankingData {
    rank: number;
    menuName: string;
    totalQuantity: number;
    totalAmount: number;
}
// 백엔드는 MenuRankingData[] 배열 자체를 반환함

// 4. 매출 요약 (Summary)
export interface SalesSummaryResponse {
    totalOrderCount: number;
    totalAmount: number;
    averageOrderAmount: number; // 객단가
    maxOrderAmount: number;
    minOrderAmount: number;
    orderCountGrowthRate: number | null;
    totalAmountGrowthRate: number | null;
    avgAmountGrowthRate: number | null;
    maxAmountGrowthRate: number | null;
}
