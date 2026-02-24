import apiClient from './client';

export interface Ingredient {
    name: string;
    amount: string;
    unit: string;
}

export type MenuStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface MenuResponse {
    menuPublicId: string;
    name: string;
    basePrice: number;
    status: MenuStatus;
    ingredientsJson: Ingredient[];
}

export interface MenuCreateRequest {
    name: string;
    basePrice: number;
    status: MenuStatus;
    ingredientsJson: Ingredient[];
}

export interface MenuUpdateRequest {
    name: string;
    basePrice: number;
    status: MenuStatus;
    ingredientsJson: Ingredient[];
}

/**
 * 메뉴 생성
 */
export const createMenu = async (storePublicId: string, request: MenuCreateRequest): Promise<string> => {
    const response = await apiClient.post<string>(`/api/menus/${storePublicId}`, request);
    return response.data;
};

/**
 * 매장 메뉴 목록 조회
 */
export const getMenus = async (storePublicId: string): Promise<MenuResponse[]> => {
    const response = await apiClient.get<MenuResponse[]>(`/api/menus/${storePublicId}`);
    return response.data;
};

/**
 * 메뉴 상세 조회
 */
export const getMenu = async (storePublicId: string, menuPublicId: string): Promise<MenuResponse> => {
    const response = await apiClient.get<MenuResponse>(`/api/menus/${storePublicId}/${menuPublicId}`);
    return response.data;
};

/**
 * 메뉴 수정
 */
export const updateMenu = async (storePublicId: string, menuPublicId: string, request: MenuUpdateRequest): Promise<void> => {
    await apiClient.put(`/api/menus/${storePublicId}/${menuPublicId}`, request);
};

/**
 * 메뉴 삭제
 */
export const deleteMenu = async (storePublicId: string, menuPublicId: string): Promise<void> => {
    await apiClient.delete(`/api/menus/${storePublicId}/${menuPublicId}`);
};
