import apiClient from "./client";
import type {ReceiptResponse} from "@/types";
import {requireStorePublicId} from "@/utils/store.ts";

export const analyzeReceipt = async (
    file: File,
    signal?: AbortSignal
): Promise<ReceiptResponse> => {
    const formData = new FormData();
    formData.append("files", file);

    const storePublicId = requireStorePublicId();

    if (!storePublicId) {
        throw new Error("store_public_id not found in localStorage.");
    }

    // URL에 storePublicId를 포함하여 요청합니다.
    const response = await apiClient.post<ReceiptResponse>(
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
