// --- Menu Types ---
export type MenuStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface RecipeItem {
  ingredientPublicId: string;     // UUID
  qty: string | number;           // 기존 amount -> qty
  unit: string;                   // "EA" 등
  name?: string;                  // 화면 표시용(선택)
}

export interface MenuResponse {
  menuPublicId: string;
  name: string;
  basePrice: number;
  status: MenuStatus;
  ingredientsJson: RecipeItem[];  // 변경
}

export interface MenuCreateRequest {
  name: string;
  basePrice: number;
  status: MenuStatus;
  ingredientsJson: RecipeItem[];  // 변경
}

export interface MenuUpdateRequest {
  name?: string;
  basePrice?: number;
  status?: MenuStatus;
  ingredientsJson?: RecipeItem[]; // 변경
}