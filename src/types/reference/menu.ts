// --- Menu Types ---
export type MenuStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface RecipeItem {
  ingredientPublicId: string;
  qty: string | number;
  unit: string;
  name?: string;
}

export interface MenuResponse {
  menuPublicId: string;
  name: string;
  basePrice: number;
  status: MenuStatus;
  ingredientsJson: RecipeItem[];
}

export interface MenuCreateRequest {
  name: string;
  basePrice: number;
  status: MenuStatus;
  ingredientsJson: RecipeItem[];
}

export interface MenuUpdateRequest {
  name?: string;
  basePrice?: number;
  status?: MenuStatus;
  ingredientsJson?: RecipeItem[];
}