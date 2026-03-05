// --- Document Types ---
export interface DocumentResponse {
    documentId: number;
    fileName: string;
    presignedUrl: string;
    uploadedAt: string;
}