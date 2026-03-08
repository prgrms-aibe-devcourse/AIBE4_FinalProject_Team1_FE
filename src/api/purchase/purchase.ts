import apiClient from '../user/client.ts';
import type {
    PurchaseOrderSummary,
    PurchaseOrderDetail,
    PurchaseOrderCreateRequest,
    PurchaseOrderUpdateRequest,
    PurchaseOrderSearchRequest
} from '@/types/purchase/purchase';
import type { PageResponse } from '@/types/common/common';

/**
 * 발주서 목록 조회
 * GET /api/purchase-orders/{storePublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param params 검색/필터/페이징 파라미터
 */
export const getPurchaseOrders = (storePublicId: string, params?: PurchaseOrderSearchRequest & { page?: number; size?: number }) =>
    apiClient.get<PageResponse<PurchaseOrderSummary>>(`/api/purchase-orders/${storePublicId}`, { params });

/**
 * 발주서 상세 조회
 * GET /api/purchase-orders/{storePublicId}/{purchaseOrderPublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param purchaseOrderPublicId 발주서 Public ID (UUID)
 */
export const getPurchaseOrder = (storePublicId: string, purchaseOrderPublicId: string) =>
    apiClient.get<PurchaseOrderDetail>(`/api/purchase-orders/${storePublicId}/${purchaseOrderPublicId}`);

/**
 * 발주서 생성
 * POST /api/purchase-orders/{storePublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param data 발주서 생성 요청 데이터
 */
export const createPurchaseOrder = (storePublicId: string, data: PurchaseOrderCreateRequest) =>
    apiClient.post<PurchaseOrderDetail>(`/api/purchase-orders/${storePublicId}`, data);

/**
 * 발주서 수정
 * PUT /api/purchase-orders/{storePublicId}/{purchaseOrderPublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param purchaseOrderPublicId 발주서 Public ID (UUID)
 * @param data 발주서 수정 요청 데이터
 */
export const updatePurchaseOrder = (
    storePublicId: string,
    purchaseOrderPublicId: string,
    data: PurchaseOrderUpdateRequest
) =>
    apiClient.put<PurchaseOrderDetail>(
        `/api/purchase-orders/${storePublicId}/${purchaseOrderPublicId}`,
        data
    );

/**
 * 발주서 취소
 * POST /api/purchase-orders/{storePublicId}/{purchaseOrderPublicId}/cancel
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param purchaseOrderPublicId 발주서 Public ID (UUID)
 */
export const cancelPurchaseOrder = (storePublicId: string, purchaseOrderPublicId: string) =>
    apiClient.post<PurchaseOrderDetail>(
        `/api/purchase-orders/${storePublicId}/${purchaseOrderPublicId}/cancel`
    );

/**
 * 발주서 PDF 다운로드
 * GET /api/purchase-orders/{storePublicId}/{purchaseOrderPublicId}/pdf
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param purchaseOrderPublicId 발주서 Public ID (UUID)
 */
export const downloadPurchaseOrderPdf = (storePublicId: string, purchaseOrderPublicId: string) =>
    apiClient.get(`/api/purchase-orders/${storePublicId}/${purchaseOrderPublicId}/pdf`, {
        responseType: 'blob'
    });