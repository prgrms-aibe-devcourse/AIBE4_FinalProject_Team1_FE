import apiClient from '../user/client.ts';
import type { VendorResponse, VendorCreateRequest, VendorUpdateRequest, VendorStatus } from '@/types/reference/vendor';

/**
 * 거래처 목록 조회
 * GET /api/vendors/{storePublicId}
 *
 * @param storePublicId 매장 Public ID (UUID)
 * @param status 상태 필터 (ACTIVE | INACTIVE) - 선택적, 기본값 ACTIVE
 */
export const getVendors = (storePublicId: string, status?: VendorStatus) =>
    apiClient.get<VendorResponse[]>(`/api/vendors/${storePublicId}`, {
        params: status ? { status } : { status: 'ACTIVE' }
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
