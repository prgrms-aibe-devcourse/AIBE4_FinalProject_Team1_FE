import axios, {
    type AxiosError,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios';
import {
    getAccessToken,
    setAccessToken,
    removeAccessToken,
    extractToken,
} from '@/utils/auth.ts';
import type { ApiResponse } from '@/types/common/common.ts';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
    baseURL: apiBaseUrl,
    timeout: 70000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

const refreshClient = axios.create({
    baseURL: apiBaseUrl,
    timeout: 70000,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string | null) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

function normalizeToken(token: string | null | undefined): string | null {
    if (!token) return null;
    const extracted = extractToken(token);
    return extracted ? extracted.replace(/^"(.*)"$/, '$1') : null;
}

function isApiResponseEnvelope<T>(data: unknown): data is ApiResponse<T> {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return false;
    }

    const obj = data as Record<string, unknown>;

    return (
        typeof obj.status === 'string' &&
        typeof obj.code === 'string' &&
        typeof obj.path === 'string' &&
        'data' in obj &&
        (typeof obj.timestamp === 'string' || Array.isArray(obj.timestamp))
    );
}

function unwrapApiResponse<T>(
    response: AxiosResponse<T | ApiResponse<T>>,
): AxiosResponse<T> {
    if (isApiResponseEnvelope<T>(response.data)) {
        return {
            ...response,
            data: response.data.data as T,
        };
    }

    return response as AxiosResponse<T>;
}

export const reissueAccessToken = async (): Promise<string | null> => {
    if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;

    try {
        const response = await refreshClient.post('/api/auth/reissue');
        const headerToken =
            response.headers['authorization'] || response.headers['Authorization'];

        const newAccessToken = normalizeToken(headerToken);

        if (!newAccessToken) {
            throw new Error('재발급 응답 헤더에 access token 이 없습니다.');
        }

        setAccessToken(newAccessToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return newAccessToken;
    } catch (refreshError) {
        processQueue(refreshError, null);
        removeAccessToken();
        return null;
    } finally {
        isRefreshing = false;
    }
};

export const ensureAccessToken = async (): Promise<string | null> => {
    const currentToken = normalizeToken(getAccessToken());
    if (currentToken) {
        return currentToken;
    }
    return reissueAccessToken();
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = normalizeToken(getAccessToken());

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        return unwrapApiResponse(response);
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (!originalRequest) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url?.includes('/api/auth/reissue')) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            const newAccessToken = await reissueAccessToken();

            if (!newAccessToken) {
                removeAccessToken();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return apiClient(originalRequest);
        }

        return Promise.reject(error);
    },
);

export default apiClient;