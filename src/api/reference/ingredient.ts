import apiClient from '../user/client.ts';
import type {
  IngredientResponse,
  IngredientCreateRequest,
  IngredientUpdateRequest,
} from '@/types';

// Re-export types for convenience
export type { IngredientResponse, IngredientUnit, IngredientStatus } from '@/types';

/**
 * 식재료 생성
 * POST /api/stores/{storePublicId}/ingredients
 * @returns ingredientPublicId (UUID)
 */
export async function createIngredient(storePublicId: string, request: IngredientCreateRequest): Promise<string> {
  const response = await apiClient.post<string>(`/api/stores/${storePublicId}/ingredients`, request);
  return response.data;
}

/**
 * 식재료 목록 조회
 * GET /api/stores/{storePublicId}/ingredients
 */
export async function getIngredients(storePublicId: string): Promise<IngredientResponse[]> {
  const response = await apiClient.get<IngredientResponse[]>(`/api/stores/${storePublicId}/ingredients`);
  return response.data;
}

/**
 * 식재료 상세 조회
 * GET /api/stores/{storePublicId}/ingredients/{ingredientPublicId}
 */
export async function getIngredient(storePublicId: string, ingredientPublicId: string): Promise<IngredientResponse> {
  const response = await apiClient.get<IngredientResponse>(`/api/stores/${storePublicId}/ingredients/${ingredientPublicId}`);
  return response.data;
}

/**
 * 식재료 수정
 * PUT /api/stores/{storePublicId}/ingredients/{ingredientPublicId}
 */
export async function updateIngredient(
  storePublicId: string,
  ingredientPublicId: string,
  request: IngredientUpdateRequest
): Promise<void> {
  await apiClient.put<void>(`/api/stores/${storePublicId}/ingredients/${ingredientPublicId}`, request);
}

/**
 * 식재료 삭제
 * DELETE /api/stores/{storePublicId}/ingredients/{ingredientPublicId}
 */
export async function deleteIngredient(storePublicId: string, ingredientPublicId: string): Promise<void> {
  await apiClient.delete<void>(`/api/stores/${storePublicId}/ingredients/${ingredientPublicId}`);
}
