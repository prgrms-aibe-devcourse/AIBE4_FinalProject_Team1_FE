import apiClient from './client';

// 로그인
export const login = (credentials: { email: string; password: string }) =>
  apiClient.post('/api/auth/login', credentials);

// 로그아웃
export const logout = () => apiClient.post('/api/auth/logout');

// 토큰 재발급
export const reissue = () => apiClient.post('/api/auth/reissue');

// 사용자 정보 조회
export const getMe = () => apiClient.get('/api/auth/me');

// 회원가입
export const register = (userData: any) => apiClient.post('/api/auth/register', userData);
