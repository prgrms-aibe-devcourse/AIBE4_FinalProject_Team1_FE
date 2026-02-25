/**
 * 거래처 상태
 */
export type VendorStatus = 'ACTIVE' | 'INACTIVE';

/**
 * 거래처 응답
 * GET /api/vendors/{storePublicId}
 * GET /api/vendors/{storePublicId}/{vendorPublicId}
 * POST /api/vendors/{storePublicId}
 * PATCH /api/vendors/{storePublicId}/{vendorPublicId}
 */
export interface VendorResponse {
    vendorPublicId: string;
    name: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    leadTimeDays: number | null;
    status: VendorStatus;
    createdAt: string;
    updatedAt: string;
}

/**
 * 거래처 생성 요청
 * POST /api/vendors/{storePublicId}
 */
export interface VendorCreateRequest {
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    leadTimeDays?: number;
}

/**
 * 거래처 수정 요청
 * PATCH /api/vendors/{storePublicId}/{vendorPublicId}
 */
export interface VendorUpdateRequest {
    contactPerson?: string;
    phone?: string;
    email?: string;
    leadTimeDays?: number;
}