import apiClient from './client';

// 사용자 정보 조회
export const getUserProfile = async () => {
    const response = await apiClient.get('/api/users/me');
    return response.data;
};