import client from '../user/client.ts';
export * from '@/types/sales/diningTable';
import type {
    DiningTableResponse,
    DiningTableCreateRequest,
    DiningTableUpdateRequest
} from '@/types/sales/diningTable';

export const createTable = async (storePublicId: string, request: DiningTableCreateRequest): Promise<string> => {
    const response = await client.post<string>(`/api/tables/${storePublicId}`, request);
    return response.data;
};

export const getTables = async (storePublicId: string): Promise<DiningTableResponse[]> => {
    const response = await client.get<DiningTableResponse[]>(`/api/tables/${storePublicId}`);
    return response.data;
};

export const getTable = async (storePublicId: string, tablePublicId: string): Promise<DiningTableResponse> => {
    const response = await client.get<DiningTableResponse>(`/api/tables/${storePublicId}/${tablePublicId}`);
    return response.data;
};

export const updateTable = async (
    storePublicId: string,
    tablePublicId: string,
    request: DiningTableUpdateRequest
): Promise<void> => {
    await client.put(`/api/tables/${storePublicId}/${tablePublicId}`, request);
};

export const deleteTable = async (storePublicId: string, tablePublicId: string): Promise<void> => {
    await client.delete(`/api/tables/${storePublicId}/${tablePublicId}`);
};
