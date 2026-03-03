export interface TableQrIssueResponse {
    tablePublicId: string;
    qrUrl: string;
    issuedAt: string;
}

export interface TableQrResponse {
    tablePublicId: string;
    tableCode: string;
    qrUrl: string;
    issuedAt: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface TableQrsIssueRequest {
    tablePublicIds: string[];
}
