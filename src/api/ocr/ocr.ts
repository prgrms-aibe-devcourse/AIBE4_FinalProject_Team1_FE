import apiClient from "../user/client.ts";
import type {ReceiptResponse} from "@/types";
import {requireStorePublicId} from "@/utils/store.ts";

// 1. 서버의 실제 응답 구조를 정의합니다.
export interface OCRScanResponse {
    results: ReceiptResponse[];
}

export const analyzeReceipt = async (
    file: File,
    signal?: AbortSignal
): Promise<OCRScanResponse> => { // 2. 리턴 타입을 실제 구조인 OCRScanResponse로 변경
    const formData = new FormData();
    formData.append("files", file);

    const storePublicId = requireStorePublicId();

    if (!storePublicId) {
        throw new Error("store_public_id not found in localStorage.");
    }

    // 3. post 제네릭 타입도 OCRScanResponse로 맞춥니다.
    const response = await apiClient.post<OCRScanResponse>(
        `/api/documents/${storePublicId}/ocr`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            signal,
        }
    );

    return response.data;
};