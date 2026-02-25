/**
 * Authorization 헤더 값에서 Bearer 접두사를 제거하고 순수 토큰만 추출합니다.
 */
export const extractToken = (authHeader: string | null | undefined): string | null => {
    if (!authHeader) return null;
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return authHeader;
};

/**
 * Access Token을 localStorage에 저장합니다.
 * Bearer 접두사가 포함되어 있으면 제거 후 저장합니다.
 */
export const setAccessToken = (token: string | null | undefined): void => {
    if (!token) {
        localStorage.removeItem('accessToken');
        return;
    }
    const tokenOnly = extractToken(token);
    if (tokenOnly) {
        localStorage.setItem('accessToken', tokenOnly);
    }
};

/**
 * 저장된 Access Token을 가져옵니다.
 */
export const getAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
};

/**
 * Access Token을 삭제합니다.
 */
export const removeAccessToken = (): void => {
    localStorage.removeItem('accessToken');
};
