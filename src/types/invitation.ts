// --- Invitation Enums ---
export type InvitationStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';

// --- Invitation Response Types ---
export interface InvitationCreateResponse {
  invitationId: number;
  storeId: number;
  code: string;
  expiresAt: string;
  status: InvitationStatus;
}

export interface InvitationAcceptResponse {
  storeId: number;
  storeName: string;
  role: string;
}

export interface InvitationItemResponse {
  invitationId: number;
  code: string;
  expiresAt: string;
  status: InvitationStatus;
}

// --- Invitation Request Types ---
export interface InvitationAcceptRequest {
  token?: string;
  storeId?: number;
  code?: string;
}
