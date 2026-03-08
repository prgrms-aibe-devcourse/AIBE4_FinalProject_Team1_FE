import apiClient from '../user/client.ts';
import type {
    StockInboundResponse,
    BulkResolveResponse,
    BulkProductNormalizeResponse,
    ManualInboundRequest
} from '@/types';

const base = (storePublicId: string, inboundPublicId: string) =>
    `/api/stores/${storePublicId}/inbounds/${inboundPublicId}`;

export type ConfirmIngredientMappingRequest = {
    existingIngredientPublicId?: string | null;
    newIngredientName?: string | null;
    newIngredientUnit?: string | null;
};

/**
 * 수기 입고 등록 (DRAFT 생성)
 * POST /api/stores/{storePublicId}/inbounds
 */
export async function createManualInbound(
    storePublicId: string,
    request: ManualInboundRequest
): Promise<StockInboundResponse> {
    const res = await apiClient.post<StockInboundResponse>(
        `/api/stores/${storePublicId}/inbounds`,
        request
    );
    return res.data;
}

/**
 * 입고 상세 조회
 * GET /api/stores/{storePublicId}/inbounds/{inboundPublicId}
 */
export async function fetchInboundDetail(
    storePublicId: string,
    inboundPublicId: string
): Promise<StockInboundResponse> {
    const res = await apiClient.get<StockInboundResponse>(
        base(storePublicId, inboundPublicId)
    );
    return res.data;
}

/**
 * 입고 아이템 전체 재료 정규화
 * POST /api/stores/{storePublicId}/inbounds/{inboundPublicId}/items/ingredient-mapping/resolve
 */
export async function resolveAllIngredients(
    storePublicId: string,
    inboundPublicId: string
): Promise<BulkResolveResponse> {
    const res = await apiClient.post<BulkResolveResponse>(
        `${base(storePublicId, inboundPublicId)}/items/ingredient-mapping/resolve`
    );
    return res.data;
}

/**
 * 입고 아이템 재료 매핑 확정 (기존 재료 선택 또는 새 재료 생성)
 * PUT /api/stores/{storePublicId}/inbounds/{inboundPublicId}/items/{inboundItemPublicId}/ingredient-mapping
 */
export async function confirmIngredientMapping(
    storePublicId: string,
    inboundPublicId: string,
    inboundItemPublicId: string,
    payload: ConfirmIngredientMappingRequest
): Promise<unknown> {
    const res = await apiClient.put(
        `${base(storePublicId, inboundPublicId)}/items/${inboundItemPublicId}/ingredient-mapping`,
        payload
    );
    return res.data;
}

/**
 * 입고 아이템 전체 상품명 정규화
 * POST /api/stores/{storePublicId}/inbounds/{inboundPublicId}/items/product-name/normalize
 */
export async function normalizeAllProductNames(
    storePublicId: string,
    inboundPublicId: string
): Promise<BulkProductNormalizeResponse> {
    const res = await apiClient.post<BulkProductNormalizeResponse>(
        `${base(storePublicId, inboundPublicId)}/items/product-name/normalize`
    );
    return res.data;
}

/**
 * 입고 확정
 * POST /api/stores/{storePublicId}/inbounds/{inboundPublicId}/confirm
 */
export async function confirmInboundFinal(
    storePublicId: string,
    inboundPublicId: string
): Promise<void> {
    await apiClient.post(
        `${base(storePublicId, inboundPublicId)}/confirm`
    );
}