import apiClient from './client.ts';
import type {
  IngredientResponse,
  IngredientCreateRequest,
  IngredientUpdateRequest,
} from '../types';

/**
 * 식재료 생성
 * POST /api/ingredients/{storePublicId}
 * @returns ingredientPublicId (UUID)
 */
export async function createIngredient(storePublicId: string, request: IngredientCreateRequest): Promise<string> {
  const response = await apiClient.post<string>(`/api/ingredients/${storePublicId}`, request);
  return response.data;
}

/**
 * 식재료 목록 조회
 * GET /api/ingredients/{storePublicId}
 */
export async function getIngredients(storePublicId: string): Promise<IngredientResponse[]> {
  const response = await apiClient.get<IngredientResponse[]>(`/api/ingredients/${storePublicId}`);
  return response.data;
}

/**
 * 식재료 상세 조회
 * GET /api/ingredients/{storePublicId}/{ingredientPublicId}
 */
export async function getIngredient(storePublicId: string, ingredientPublicId: string): Promise<IngredientResponse> {
  const response = await apiClient.get<IngredientResponse>(`/api/ingredients/${storePublicId}/${ingredientPublicId}`);
  return response.data;
}

/**
 * 식재료 수정
 * PUT /api/ingredients/{storePublicId}/{ingredientPublicId}
 */
export async function updateIngredient(
  storePublicId: string,
  ingredientPublicId: string,
  request: IngredientUpdateRequest
): Promise<void> {
  await apiClient.put<void>(`/api/ingredients/${storePublicId}/${ingredientPublicId}`, request);
}

/**
 * 식재료 삭제
 * DELETE /api/ingredients/{storePublicId}/{ingredientPublicId}
 */
export async function deleteIngredient(storePublicId: string, ingredientPublicId: string): Promise<void> {
  await apiClient.delete<void>(`/api/ingredients/${storePublicId}/${ingredientPublicId}`);
}
