import apiClient from '../user/client.ts';
import type {
    VendorResponse,
    VendorCreateRequest,
    VendorUpdateRequest,
    VendorSearchRequest
} from '@/types/reference/vendor';
import type { PageResponse } from '@/types/common/common';

/**
 * 거래처 목록 조회
 * GET /api/vendors/{storePublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param params 검색 및 페이지네이션 파라미터
 */
export const getVendors = (storePublicId: string, params?: VendorSearchRequest) =>
    apiClient.get<PageResponse<VendorResponse>>(`/api/vendors/${storePublicId}`, {
        params
    });

/**
 * 거래처 상세 조회
 * GET /api/vendors/{storePublicId}/{vendorPublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param vendorPublicId 거래처 Public ID (UUID)
 */
export const getVendor = (storePublicId: string, vendorPublicId: string) =>
    apiClient.get<VendorResponse>(`/api/vendors/${storePublicId}/${vendorPublicId}`);

/**
 * 거래처 생성
 * POST /api/vendors/{storePublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param data 거래처 생성 요청 데이터
 */
export const createVendor = (storePublicId: string, data: VendorCreateRequest) =>
    apiClient.post<VendorResponse>(`/api/vendors/${storePublicId}`, data);

/**
 * 거래처 수정
 * PATCH /api/vendors/{storePublicId}/{vendorPublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param vendorPublicId 거래처 Public ID (UUID)
 * @param data 거래처 수정 요청 데이터
 */
export const updateVendor = (storePublicId: string, vendorPublicId: string, data: VendorUpdateRequest) =>
    apiClient.patch<VendorResponse>(`/api/vendors/${storePublicId}/${vendorPublicId}`, data);

/**
 * 거래처 삭제 (비활성화)
 * DELETE /api/vendors/{storePublicId}/{vendorPublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param vendorPublicId 거래처 Public ID (UUID)
 */
export const deleteVendor = (storePublicId: string, vendorPublicId: string) =>
    apiClient.delete<void>(`/api/vendors/${storePublicId}/${vendorPublicId}`);
