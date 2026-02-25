import apiClient from "./client";
import type {ReceiptResponse} from "@/types";

export const analyzeReceipt = async (
    file: File,
    signal?: AbortSignal
): Promise<ReceiptResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ReceiptResponse>(
        "/api/documents/ocr",
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