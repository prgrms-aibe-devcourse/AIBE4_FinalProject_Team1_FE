import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 전송 허용
});

// 토큰 재발급 중인지 확인하는 플래그
let isRefreshing = false;
// 재발급 대기 중인 요청 큐
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// JWT 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 재시도한 적이 없는 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 재발급 요청 자체가 401을 받은 경우 즉시 에러 반환 (무한 루프 방지)
      if (originalRequest.url?.includes('/api/auth/reissue')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 이미 재발급 중이면 큐에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 토큰 재발급 요청 (auth.ts의 reissue 함수 사용)
        // 순환 참조 방지를 위해 필요 시점에서 동적 임포트 고려 가능하나,
        // 여기서는 일단 직접 임포트 대신 axios 정의를 그대로 두거나 
        // 유저 요청대로 auth.ts의 것을 쓰되 루프 방지 처리

        const { reissue } = await import('./auth');
        const response = await reissue();

        // 응답 헤더나 바디에서 access token 추출
        const newAccessToken = response.headers['authorization']?.split(' ')[1];

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
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
