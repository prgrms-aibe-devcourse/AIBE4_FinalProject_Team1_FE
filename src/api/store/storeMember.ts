import apiClient from '../user/client.ts';
import type { StoreMemberResponse, MemberStatusUpdateRequest } from '@/types';

/**
 * 매장 멤버 목록 조회
 * GET /api/stores/{storePublicId}/members
 */
export const getStoreMembers = async (storePublicId: string): Promise<StoreMemberResponse[]> => {
  const response = await apiClient.get<StoreMemberResponse[]>(`/api/stores/${storePublicId}/members`);
  return response.data;
};

/**
 * 매장 멤버 단건 조회
 * GET /api/stores/{storePublicId}/members/{memberId}
 */
export const getStoreMember = async (storePublicId: string, memberId: number): Promise<StoreMemberResponse> => {
  const response = await apiClient.get<StoreMemberResponse>(`/api/stores/${storePublicId}/members/${memberId}`);
  return response.data;
};

/**
 * 매장 멤버 상태 변경 (ACTIVE <-> INACTIVE)
 * PATCH /api/stores/{storePublicId}/members/{memberId}/status
 */
export const updateMemberStatus = async (
  storePublicId: string,
  memberId: number,
  request: MemberStatusUpdateRequest
): Promise<StoreMemberResponse> => {
  const response = await apiClient.patch<StoreMemberResponse>(
    `/api/stores/${storePublicId}/members/${memberId}/status`,
    request
  );
  return response.data;
};
