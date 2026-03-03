export interface TableQrIssueResponse {
    tablePublicId: string;
    qrImageUrl: string;
    createdAt: string;
}

export interface TableQrResponse {
    tablePublicId: string;
    tableCode: string;
    qrImageUrl: string;
    createdAt: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface TableQrsIssueRequest {
    tablePublicIds: string[];
}
