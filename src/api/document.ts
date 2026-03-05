import apiClient from './client.ts'
import type {
    DocumentResponse,
} from '@/types';

/**
 * 등록된 파일 목록 조회
 * GET /api/documents/{storePublicId}
 */

export async function getDocuments(storePublicId: string): Promise<DocumentResponse[]> {
    const response = await apiClient.get<DocumentResponse[]>(`/api/documents/${storePublicId}`);
    return response.data;
}