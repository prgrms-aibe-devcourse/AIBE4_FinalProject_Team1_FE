import apiClient from './client.ts';
import type {
  MyStoreResponse,
  CreateStoreRequest,
  StoreCreateResponse,
  StoreNameUpdateRequest,
} from '@/types';

/**
 * 내 소속 매장 목록 조회
 * GET /api/stores
 */
export async function getMyStores(): Promise<MyStoreResponse[]> {
  const response = await apiClient.get('/api/stores');
  return response.data;
}

/**
 * 매장 등록
 * POST /api/stores
 */
export async function createStore(data: CreateStoreRequest): Promise<StoreCreateResponse> {
  const response = await apiClient.post('/api/stores', data);
  return response.data;
}

/**
 * 매장 단건 조회
 * GET /api/stores/{storeId}
 */
export async function getStoreById(storeId: number): Promise<MyStoreResponse> {
  const response = await apiClient.get(`/api/stores/${storeId}`);
  return response.data;
}

/**
 * 매장 상호명 변경
 * PATCH /api/stores/{storeId}/name
 */
export async function updateStoreName(storeId: number, data: StoreNameUpdateRequest): Promise<MyStoreResponse> {
  const response = await apiClient.patch(`/api/stores/${storeId}/name`, data);
  return response.data;
}

/**
 * 대표 매장 설정
 * POST /api/stores/{storeId}/default
 */
export async function setDefaultStore(storeId: number): Promise<void> {
  await apiClient.post(`/api/stores/${storeId}/default`);
}
