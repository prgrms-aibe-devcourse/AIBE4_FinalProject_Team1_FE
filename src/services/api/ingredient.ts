import apiClient from './client';

// --- 식재료(Ingredient) 관련 타입 정의 ---
export type IngredientUnit = 'EA' | 'KG' | 'L';
export type IngredientStatus = 'ACTIVE' | 'INACTIVE';

export interface IngredientResponse {
    ingredientPublicId: string;
    name: string;
    unit: IngredientUnit;
    lowStockThreshold: number;
    status: IngredientStatus;
}

export interface IngredientCreateRequest {
    name: string;
    unit: IngredientUnit;
    lowStockThreshold: number;
}

export interface IngredientUpdateRequest {
    name: string;
    unit: IngredientUnit;
    lowStockThreshold: number;
    status: IngredientStatus;
}

/**
 * 식재료 생성
 * POST /api/ingredients/{storePublicId}
 */
export const createIngredient = (storePublicId: string, request: IngredientCreateRequest) =>
    apiClient.post<string>(`/api/ingredients/${storePublicId}`, request);

/**
 * 식재료 목록 조회
 * GET /api/ingredients/{storePublicId}
 */
export const getIngredients = (storePublicId: string) =>
    apiClient.get<IngredientResponse[]>(`/api/ingredients/${storePublicId}`);

/**
 * 식재료 상세 조회
 * GET /api/ingredients/{storePublicId}/{ingredientPublicId}
 */
export const getIngredient = (storePublicId: string, ingredientPublicId: string) =>
    apiClient.get<IngredientResponse>(`/api/ingredients/${storePublicId}/${ingredientPublicId}`);

/**
 * 식재료 수정
 * PUT /api/ingredients/{storePublicId}/{ingredientPublicId}
 */
export const updateIngredient = (storePublicId: string, ingredientPublicId: string, request: IngredientUpdateRequest) =>
    apiClient.put<void>(`/api/ingredients/${storePublicId}/${ingredientPublicId}`, request);

/**
 * 식재료 삭제
 * DELETE /api/ingredients/{storePublicId}/{ingredientPublicId}
 */
export const deleteIngredient = (storePublicId: string, ingredientPublicId: string) =>
    apiClient.delete<void>(`/api/ingredients/${storePublicId}/${ingredientPublicId}`);
