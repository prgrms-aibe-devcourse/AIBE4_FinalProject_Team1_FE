// --- Menu Types ---
export type MenuStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface Ingredient {
  name: string;
  amount: string | number;
  unit: string;
}

export interface MenuResponse {
  menuPublicId: string; // UUID
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
  name?: string;
  basePrice?: number;
  status?: MenuStatus;
  ingredientsJson?: Ingredient[];
}
