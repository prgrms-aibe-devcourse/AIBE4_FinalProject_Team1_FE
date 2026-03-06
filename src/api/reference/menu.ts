import apiClient from '../user/client.ts';
import type {
  MenuResponse,
  MenuCreateRequest,
  MenuUpdateRequest,
} from '../../types';

// Re-export types for convenience
export type { MenuResponse, MenuStatus } from '../../types';

/**
 * 메뉴 목록 조회
 * GET /api/menus/{storePublicId}
 */
export async function getMenus(storePublicId: string): Promise<MenuResponse[]> {
  const response = await apiClient.get<MenuResponse[]>(`/api/menus/${storePublicId}`);
  return response.data;
}

/**
 * 메뉴 상세 조회
 * GET /api/menus/{storePublicId}/{menuPublicId}
 */
export async function getMenu(storePublicId: string, menuPublicId: string): Promise<MenuResponse> {
  const response = await apiClient.get<MenuResponse>(`/api/menus/${storePublicId}/${menuPublicId}`);
  return response.data;
}

/**
 * 메뉴 생성
 * POST /api/menus/{storePublicId}
 * @returns menuPublicId (UUID)
 */
export async function createMenu(storePublicId: string, request: MenuCreateRequest): Promise<string> {
  const response = await apiClient.post<string>(`/api/menus/${storePublicId}`, request);
  return response.data;
}

/**
 * 메뉴 수정
 * PUT /api/menus/{storePublicId}/{menuPublicId}
 */
export async function updateMenu(
  storePublicId: string,
  menuPublicId: string,
  request: MenuUpdateRequest
): Promise<void> {
  await apiClient.put<void>(`/api/menus/${storePublicId}/${menuPublicId}`, request);
}

/**
 * 메뉴 삭제
 * DELETE /api/menus/{storePublicId}/{menuPublicId}
 */
export async function deleteMenu(storePublicId: string, menuPublicId: string): Promise<void> {
  await apiClient.delete<void>(`/api/menus/${storePublicId}/${menuPublicId}`);
}
