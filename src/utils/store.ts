const STORE_ID_KEY = 'store_public_id';
const DEFAULT_STORE_ID = 'fe9b14cd-55ed-4006-bf20-c1a2697c06db';

/**
 * 현재 선택된 매장의 Public ID를 반환합니다.
 * 우선순위: localStorage > DEFAULT_STORE_ID
 */
export const getStorePublicId = (): string => {
    const savedId = localStorage.getItem(STORE_ID_KEY);
    return savedId || DEFAULT_STORE_ID;
};

/**
 * 매장 Public ID를 설정합니다.
 */
export const setStorePublicId = (id: string): void => {
    localStorage.setItem(STORE_ID_KEY, id);
};

/**
 * 등록된 매장 ID를 제거합니다.
 */
export const removeStorePublicId = (): void => {
    localStorage.removeItem(STORE_ID_KEY);
};
