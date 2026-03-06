import apiClient from './client.ts';
import type {
    StockInboundResponse,
    BulkResolveResponse,
    IngredientResolveResponse,
    BulkIngredientConfirmRequest,
    BulkIngredientConfirmResponse,
    BulkProductNormalizeResponse,
    ManualInboundRequest,
    StockInboundRequest,
} from '@/types';

const base = (storePublicId: string, inboundPublicId: string) =>
    `/api/stores/${storePublicId}/inbounds/${inboundPublicId}`;

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
 * 문서 기반 입고 등록 (OCR, DRAFT 생성)
 * POST /api/stores/{storePublicId}/inbounds/from-document
 */
export async function createInboundFromDocument(
    storePublicId: string,
    request: StockInboundRequest
): Promise<StockInboundResponse> {
    const res = await apiClient.post<StockInboundResponse>(
        `/api/stores/${storePublicId}/inbounds/from-document`,
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
 * 입고 아이템 전체 재료 정규화 (후보 생성/저장)
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
 * 입고 아이템 재료 정규화 후보 산출 (단건)
 * POST /api/stores/{storePublicId}/inbounds/{inboundPublicId}/items/{inboundItemPublicId}/ingredient-mapping/resolve
 */
export async function resolveSingleItem(
    storePublicId: string,
    inboundPublicId: string,
    inboundItemPublicId: string
): Promise<IngredientResolveResponse> {
    const res = await apiClient.post<IngredientResolveResponse>(
        `${base(storePublicId, inboundPublicId)}/items/${inboundItemPublicId}/ingredient-mapping/resolve`
    );
    return res.data;
}

/**
 * 입고 아이템 재료 매핑 일괄 확정
 * PUT /api/stores/{storePublicId}/inbounds/{inboundPublicId}/items/ingredient-mapping
 */
export async function bulkConfirmIngredients(
    storePublicId: string,
    inboundPublicId: string,
    payload: BulkIngredientConfirmRequest
): Promise<BulkIngredientConfirmResponse> {
    const res = await apiClient.put<BulkIngredientConfirmResponse>(
        `${base(storePublicId, inboundPublicId)}/items/ingredient-mapping`,
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
 * 입고 확정 (재고 배치 생성)
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
