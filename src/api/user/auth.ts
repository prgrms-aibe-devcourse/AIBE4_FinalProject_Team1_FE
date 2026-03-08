import apiClient from './client.ts';

// 로그인
export const login = (credentials: { email: string; password: string }) =>
  apiClient.post('/api/auth/login', credentials);

// 소셜 로그인 (OAuth2)
export const socialLogin = (code: string) =>
  apiClient.get(`/api/auth/login?code=${code}`);

// 로그아웃
export const logout = () => apiClient.post('/api/auth/logout');

// 토큰 재발급
export const reissue = () => apiClient.post('/api/auth/reissue');

// 회원가입
export const register = (userData: any) => apiClient.post('/api/auth/register', userData);
