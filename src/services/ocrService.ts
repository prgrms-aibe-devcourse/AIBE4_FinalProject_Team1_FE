import axios from "axios";

export interface OcrResultItem {
    storeName: string;
    date: string;
    amount: string; // 백엔드에서 문자열로 옴
    paymentMethod?: string;
    category?: string;
}

export interface OcrResponse {
    results: OcrResultItem[];
}

export const analyzeReceipt = async (files: File[], signal?: AbortSignal): Promise<OcrResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append("files", file);
    });

    const response = await axios.post<OcrResponse>("http://localhost:8080/api/v1/ocr", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        signal: signal, // AbortSignal 전달
    });

    return response.data;
};
