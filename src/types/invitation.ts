// --- Invitation Enums ---
export type InvitationStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';

// --- Invitation Response Types ---
export interface InvitationCreateResponse {
  invitationId: number;
  storeId: number;
  inviteUrl: string;
  inviteCode: string;
  expiresAt: string;
}

export interface InvitationAcceptResponse {
  storeId: number;
  storePublicId: string;
  storeName: string;
  role: string;
  status: string;
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
  code?: string;
}
