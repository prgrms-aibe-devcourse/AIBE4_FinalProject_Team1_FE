import axios, {
    type AxiosError,
    type AxiosResponse,
    type InternalAxiosRequestConfig
} from 'axios';
import {
    getAccessToken,
    setAccessToken,
    removeAccessToken,
    extractToken
} from '@/utils/auth.ts';
import type { ApiResponse } from '@/types/common/common.ts';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 70000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // 쿠키 전송 허용
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
        // timestamp는 문자열일 수도, Spring Date 직렬화 배열(Array)일 수도 있음
        (typeof obj.timestamp === 'string' || Array.isArray(obj.timestamp))
    );
}

function unwrapApiResponse<T>(response: AxiosResponse<T | ApiResponse<T>>): AxiosResponse<T> {
    if (isApiResponseEnvelope<T>(response.data)) {
        return {
            ...response,
            data: response.data.data as T,
        };
    }

    return response as AxiosResponse<T>;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
        const cleanToken = token.replace(/^"(.*)"$/, '$1');
        config.headers = config.headers ?? {};
        config.headers.Authorization = cleanToken.startsWith('Bearer ')
            ? cleanToken
            : `Bearer ${cleanToken}`;
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

            if (isRefreshing) {
                return new Promise<string | null>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (!token) {
                            return Promise.reject(error);
                        }

                        originalRequest.headers = originalRequest.headers ?? {};
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { reissue } = await import('./auth.ts');
                const response = await reissue();

                const newAccessToken = extractToken(
                    response.headers['authorization'] || response.headers['Authorization']
                );

                if (!newAccessToken) {
                    throw new Error('재발급 응답 헤더에 access token 이 없습니다.');
                }

                const cleanNewToken = newAccessToken.replace(/^"(.*)"$/, '$1');
                setAccessToken(cleanNewToken);

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${cleanNewToken}`;
                originalRequest.headers = originalRequest.headers ?? {};
                originalRequest.headers.Authorization = `Bearer ${cleanNewToken}`;

                processQueue(null, cleanNewToken);
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                removeAccessToken();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
