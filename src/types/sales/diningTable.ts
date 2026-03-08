export interface DiningTableResponse {
    tablePublicId: string;
    tableCode: string;
    capacity: number;
    status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
}

export interface DiningTableCreateRequest {
    tableCode: string;
    capacity: number;
    status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
}

export interface DiningTableUpdateRequest {
    tableCode?: string;
    capacity?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
}
