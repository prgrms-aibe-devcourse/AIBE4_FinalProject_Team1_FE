import apiClient from './client';

// 상품 목록 조회
export const getProducts = () => apiClient.get('/api/products');

// 상품 생성
export const createProduct = (data: any) => apiClient.post('/api/products', data);

// 상품 상세 조회
export const getProduct = (id: string) => apiClient.get(`/api/products/${id}`);

// 상품 수정
export const updateProduct = (id: string, data: any) => apiClient.put(`/api/products/${id}`, data);

// 상품 삭제
export const deleteProduct = (id: string) => apiClient.delete(`/api/products/${id}`);
