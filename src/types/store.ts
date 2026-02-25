// --- Store Enums ---
export type StoreMemberRole = 'OWNER' | 'MEMBER';
export type StoreMemberStatus = 'ACTIVE' | 'INACTIVE';

// --- Store Response Types ---
export interface MyStoreResponse {
  storeId: number; // 내부 ID (백엔드 응답에 포함되지만 프론트엔드는 storePublicId 사용 권장)
  storePublicId: string; // UUID - API 호출 시 사용
  storeName: string;
  businessRegistrationNumber: string;
  myRole: StoreMemberRole;
  myStatus: StoreMemberStatus;
  isDefault?: boolean; // 대표 매장 여부
}

export interface StoreCreateResponse {
  storeId: number; // 내부 ID
  storePublicId: string; // UUID - API 호출 시 사용
  name: string;
  businessRegistrationNumber: string;
}

// --- Store Request Types ---
export interface CreateStoreRequest {
  name: string;
  businessRegistrationNumber: string;
}

export interface StoreNameUpdateRequest {
  name: string;
}

// --- Store Aliases (for convenience) ---
export type StoreSummary = MyStoreResponse;
export type StoreListResponse = MyStoreResponse[];

// --- Store Member Types ---
export interface StoreMemberResponse {
  storeMemberId: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: StoreMemberRole;
  status: StoreMemberStatus;
}

export interface MemberStatusUpdateRequest {
  status: StoreMemberStatus;
}

// --- Store Management UI Types ---
export type StoreManageTabType = 'list' | 'create' | 'join';
