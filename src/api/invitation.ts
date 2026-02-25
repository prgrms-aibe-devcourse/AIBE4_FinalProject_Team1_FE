import apiClient from './client.ts';
import type {
  InvitationCreateResponse,
  InvitationAcceptRequest,
  InvitationAcceptResponse,
  InvitationItemResponse,
} from '@/types';

/**
 * 초대 생성/갱신
 * POST /api/stores/{storeId}/invitations
 * OWNER만 가능. 매장당 1개의 초대만 존재하며, 재발급 시 기존 초대가 자동으로 갱신됩니다.
 */
export async function createInvitation(storeId: number): Promise<InvitationCreateResponse> {
  const response = await apiClient.post(`/api/stores/${storeId}/invitations`);
  return response.data;
}

/**
 * 초대 수락
 * POST /api/invitations/accept
 * token 또는 코드로 초대를 수락합니다. 둘 중 하나만 입력해야 합니다.
 */
export async function acceptInvitation(data: InvitationAcceptRequest): Promise<InvitationAcceptResponse> {
  const response = await apiClient.post('/api/invitations/accept', data);
  return response.data;
}

/**
 * 현재 초대 조회
 * GET /api/stores/{storeId}/invitations/active
 */
export async function getActiveInvitation(storeId: number): Promise<InvitationItemResponse> {
  const response = await apiClient.get(`/api/stores/${storeId}/invitations/active`);
  return response.data;
}

/**
 * 현재 초대 취소
 * DELETE /api/stores/{storeId}/invitations/active
 */
export async function revokeActiveInvitation(storeId: number): Promise<void> {
  await apiClient.delete(`/api/stores/${storeId}/invitations/active`);
}
