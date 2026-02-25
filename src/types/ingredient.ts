// --- Ingredient Types ---
export type IngredientUnit = 'EA' | 'KG' | 'L';
export type IngredientStatus = 'ACTIVE' | 'INACTIVE';

export interface IngredientResponse {
  ingredientPublicId: string; // UUID
  name: string;
  unit: IngredientUnit;
  lowStockThreshold: number | null; // BigDecimal
  status: IngredientStatus;
}

export interface IngredientCreateRequest {
  name: string;
  unit: IngredientUnit;
  lowStockThreshold?: number | null; // BigDecimal, optional
}

export interface IngredientUpdateRequest {
  name?: string;
  unit?: IngredientUnit;
  lowStockThreshold?: number | null; // BigDecimal
  status?: IngredientStatus;
}
