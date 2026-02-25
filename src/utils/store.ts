const STORE_ID_KEY = 'store_public_id';

/**
 * 현재 선택된 매장의 Public ID를 반환합니다.
 * localStorage에 값이 없으면 null을 반환합니다.
 */
export const getStorePublicId = (): string | null => {
  return localStorage.getItem(STORE_ID_KEY);
};

/**
 * 매장 Public ID를 설정합니다.
 */
export const setStorePublicId = (id: string): void => {
  localStorage.setItem(STORE_ID_KEY, id);
};

export const requireStorePublicId = (): string => {
  const id = getStorePublicId();
  if (!id) {
    throw new Error('store_public_id is missing in localStorage. Ensure StoreGuard is applied or redirect to onboarding.');
  }
  return id;
};
