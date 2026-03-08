export type IngredientUnit = 'EA' | 'G' | 'ML';
export type IngredientStatus = 'ACTIVE' | 'INACTIVE';

export interface IngredientResponse {
  ingredientPublicId: string;
  name: string;
  unit: IngredientUnit;
  lowStockThreshold: number | null;
  status: IngredientStatus;
}

export interface IngredientCreateRequest {
  name: string;
  unit: IngredientUnit;
  lowStockThreshold?: number | null;
}

export interface IngredientUpdateRequest {
  name?: string;
  unit?: IngredientUnit;
  lowStockThreshold?: number | null;
  status?: IngredientStatus;
}

export interface IngredientSearchRequest {
  name?: string;
  page?: number;
  size?: number;
}