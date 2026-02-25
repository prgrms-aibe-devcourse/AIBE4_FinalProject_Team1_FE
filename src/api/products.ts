import apiClient from './client.ts';
import type {
  ProductResponse,
  ProductListResponse,
  ProductCreateRequest,
  ProductUpdateRequest,
} from '@/types';

/**
 * 상품 목록 조회
 * GET /api/products
 */
export async function getProducts(): Promise<ProductListResponse> {
  const response = await apiClient.get<ProductListResponse>('/api/products');
  return response.data;
}

/**
 * 상품 생성
 * POST /api/products
 */
export async function createProduct(data: ProductCreateRequest): Promise<ProductResponse> {
  const response = await apiClient.post<ProductResponse>('/api/products', data);
  return response.data;
}

/**
 * 상품 상세 조회
 * GET /api/products/{id}
 */
export async function getProduct(id: string): Promise<ProductResponse> {
  const response = await apiClient.get<ProductResponse>(`/api/products/${id}`);
  return response.data;
}

/**
 * 상품 수정
 * PUT /api/products/{id}
 */
export async function updateProduct(id: string, data: ProductUpdateRequest): Promise<ProductResponse> {
  const response = await apiClient.put<ProductResponse>(`/api/products/${id}`, data);
  return response.data;
}

/**
 * 상품 삭제
 * DELETE /api/products/{id}
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/api/products/${id}`);
}
