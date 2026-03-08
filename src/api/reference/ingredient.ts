import apiClient from '../user/client.ts';
import type { PageResponse } from '@/types/common/common';
import type {
  IngredientResponse,
  IngredientCreateRequest,
  IngredientUpdateRequest,
  IngredientSearchRequest,
} from '@/types/reference/ingredient';

// Re-export types for convenience
export type {
  IngredientResponse,
  IngredientUnit,
  IngredientStatus,
  IngredientCreateRequest,
  IngredientUpdateRequest,
  IngredientSearchRequest,
} from '@/types/reference/ingredient';

export type { PageResponse } from '@/types/common/common';

/**
 * 식재료 생성
 * POST /api/stores/{storePublicId}/ingredients
 */
export async function createIngredient(
  storePublicId: string,
  request: IngredientCreateRequest
): Promise<IngredientResponse> {
  const response = await apiClient.post<IngredientResponse>(
    `/api/stores/${storePublicId}/ingredients`,
    request
  );
  return response.data;
}

/**
 * 식재료 페이징 목록 조회
 * GET /api/stores/{storePublicId}/ingredients?page=0&size=10&name=...
 */
export async function getIngredients(
  storePublicId: string,
  params: IngredientSearchRequest = {}
): Promise<PageResponse<IngredientResponse>> {
  const response = await apiClient.get<PageResponse<IngredientResponse>>(
    `/api/stores/${storePublicId}/ingredients`,
    {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        ...(params.name && params.name.trim() ? { name: params.name.trim() } : {}),
      },
    }
  );

  return response.data;
}

/**
 * 식재료 전체 목록 조회
 * GET /api/stores/{storePublicId}/ingredients/all
 */
export async function getAllIngredients(
  storePublicId: string
): Promise<IngredientResponse[]> {
  const response = await apiClient.get<IngredientResponse[]>(
    `/api/stores/${storePublicId}/ingredients/all`
  );
  return response.data;
}

/**
 * 식재료 상세 조회
 * GET /api/stores/{storePublicId}/ingredients/{ingredientPublicId}
 */
export async function getIngredient(
  storePublicId: string,
  ingredientPublicId: string
): Promise<IngredientResponse> {
  const response = await apiClient.get<IngredientResponse>(
    `/api/stores/${storePublicId}/ingredients/${ingredientPublicId}`
  );
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
): Promise<IngredientResponse> {
  const response = await apiClient.put<IngredientResponse>(
    `/api/stores/${storePublicId}/ingredients/${ingredientPublicId}`,
    request
  );
  return response.data;
}

/**
 * 식재료 삭제
 * DELETE /api/stores/{storePublicId}/ingredients/{ingredientPublicId}
 */
export async function deleteIngredient(
  storePublicId: string,
  ingredientPublicId: string
): Promise<void> {
  await apiClient.delete<void>(`/api/stores/${storePublicId}/ingredients/${ingredientPublicId}`);
}