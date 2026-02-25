// --- Store Enums ---
export type StoreMemberRole = 'OWNER' | 'EMPLOYEE';
export type StoreMemberStatus = 'ACTIVE' | 'INACTIVE';

// --- Store Response Types ---
export interface MyStoreResponse {
  storeId: number;
  storePublicId: string;
  storeName: string;
  businessRegistrationNumber: string;
  myRole: StoreMemberRole;
  myStatus: StoreMemberStatus;
  isDefault?: boolean; // 대표 매장 여부
}

export interface StoreCreateResponse {
  storeId: number;
  storePublicId: string;
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

// --- Store Management UI Types ---
export type StoreManageTabType = 'list' | 'create' | 'join';
