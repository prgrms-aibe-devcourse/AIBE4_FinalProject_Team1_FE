import client from './client';
import type { TableQrIssueResponse, TableQrResponse } from '@/types/sales/tableQr.ts';

/**
 * 테이블 QR 발급
 * 선택된 여러 테이블의 QR을 한 번에 생성합니다.
 */
export const issueTableQrs = async (
    storePublicId: string,
    tablePublicIds: string[]
): Promise<TableQrIssueResponse[]> => {
    const response = await client.post<TableQrIssueResponse[]>(
        `/api/dining/${storePublicId}/table-qrs/issue`,
        { tablePublicIds }
    );
    return response.data;
};

/**
 * 테이블 QR 목록 조회
 * 매장의 모든 테이블 QR을 조회합니다.
 */
export const getTableQrs = async (storePublicId: string): Promise<TableQrResponse[]> => {
    const response = await client.get<TableQrResponse[]>(`/api/dining/${storePublicId}/table-qrs`);
    return response.data;
};
