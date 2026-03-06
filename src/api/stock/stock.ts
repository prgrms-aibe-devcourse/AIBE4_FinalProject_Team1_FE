import apiClient from '../user/client.ts';
import type {
    Pagination,
    StockOrderDeductionRequest,
    StockDeductionResponse,
    StockInboundResponse,
    DisposalRequest,
    DisposalResponse,
    DisposalSearchCondition,
    DisposalPageResponse,
} from '@/types';
import type {StockLogResponse, StockLogSearchCondition} from "@/types/stock/stockLog.ts";

/**
 * 주문 재고 차감
 * POST /api/stock/{storePublicId}/deduct
 */
export async function deductStock(storePublicId: string, request: StockOrderDeductionRequest): Promise<StockDeductionResponse> {
    const response = await apiClient.post<StockDeductionResponse>(`/api/stock/${storePublicId}/deduct`, request);
    return response.data;
}


/** * --- 입고(Inbound) 관련 API 추가 ---
 */

/**
 * 입고 내역 목록 조회
 * GET /api/inbounds/{storePublicId}
 */
export const getStockInbounds = async (storePublicId: string): Promise<Pagination<StockInboundResponse>> => {
    const response = await apiClient.get(`/stock/${storePublicId}/inbound`);
    return response.data;
};

/**
 * 입고 상세 정보 조회 (UUID 기반)
 * GET /api/inbounds/{storePublicId}/{inboundPublicId}
 */
export async function getStockInboundDetail(
    storePublicId: string,
    inboundPublicId: string
): Promise<StockInboundResponse> {
    const response = await apiClient.get<StockInboundResponse>(
        `/api/inbounds/${storePublicId}/${inboundPublicId}`
    );
    return response.data;
}

/**
 * 입고 확정 처리
 * POST /api/inbounds/{storePublicId}/{inboundPublicId}/confirm
 */
export async function confirmInbound(
    storePublicId: string,
    inboundPublicId: string
): Promise<StockInboundResponse> {
    const response = await apiClient.post<StockInboundResponse>(
        `/api/inbounds/${storePublicId}/${inboundPublicId}/confirm`
    );
    return response.data;
}

/** * --- 폐기(Disposal) 관련 API 추가 ---
 */

/**
 * 폐기 등록 처리
 * POST /api/disposal/{storePublicId}
 */
export async function recordWaste(storePublicId: string, request: DisposalRequest): Promise<void> {
    await apiClient.post<DisposalResponse[]>(`/api/disposal/${storePublicId}`, request);
}

/**
 * 폐기 목록 조회
 * GET /api/disposal/{storePublicId}
 */

export async function getWasteRecords(storePublicId: string, condition: DisposalSearchCondition, page: number = 0, size: number = 20): Promise<DisposalPageResponse<DisposalResponse>> {
    const response = await apiClient.get<DisposalPageResponse<DisposalResponse>>(`/api/disposal/${storePublicId}`, {
        params: {
            ...condition,
            page,
            size,
            sort: 'wasteAt,desc'
        },
    });
    return response.data;
}

/** * --- 이력(Log) 관련 API 추가 ---
 */

/**
 * 재고 이력 조회
 * GET /api/stockLogs/{storePublicId}
 */
export async function getStockLogs(storePublicId: string, condition: StockLogSearchCondition, page: number = 0, size: number = 20): Promise<DisposalPageResponse<StockLogResponse>> {
    const response = await apiClient.get<DisposalPageResponse<StockLogResponse>>(`/api/stockLogs/${storePublicId}`, {
        params: {
            ...condition,
            page,
            size,
            sort: 'createdAt,desc'
        },
    });
    return response.data;
}